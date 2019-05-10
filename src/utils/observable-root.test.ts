import {
  autorun,
  computed,
  IComputedValue,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
  ObservableMap,
} from 'mobx';

type RootHandler<T> = {
  source: ObservableMap<string, T>;
  onObserved: (key: string, set: (value: T) => void) => void;
  onUnobserved: (key: string) => void;
};

function createRoot<T>({
  source,
  onObserved,
  onUnobserved,
}: RootHandler<T>): Record<string, T | undefined> {
  const disposers: (() => void)[] = [];

  const accessors = observable.map<
    string,
    IComputedValue<T | undefined> | undefined
  >();

  const keys = observable.array<string>([]);
  let keysArrayIsWritable = false;
  disposers.push(
    keys.intercept(change => (keysArrayIsWritable ? change : null))
  );

  disposers.push(
    accessors.observe(change => {
      switch (change.type) {
        case 'add': {
          if (!keys.includes(change.name)) {
            keysArrayIsWritable = true;
            keys.push(change.name);
            keysArrayIsWritable = false;
          }
          break;
        }
        case 'delete': {
          const idx = keys.findIndex(key => key === change.name);
          if (idx > -1) {
            keysArrayIsWritable = true;
            keys.splice(idx, 1);
            keysArrayIsWritable = false;
          }
          break;
        }
      }
    })
  );

  function getAccessor(key: string): IComputedValue<T | undefined> {
    if (accessors.has(key)) return accessors.get(key)!;

    const accessor = computed(() => source.get(key));
    accessors.set(key, accessor);

    onBecomeObserved(accessor, () =>
      onObserved(key, source.set.bind(source, key))
    );
    onBecomeUnobserved(accessor, () => {
      accessors.delete(key);
      onUnobserved(key);
    });

    return accessor;
  }

  return new Proxy(Object.create(null) as any, {
    get(target, key) {
      if (typeof key !== 'string') return undefined;
      return getAccessor(key).get();
    },
    set() {
      throw new Error('cannot set root properties');
    },
    ownKeys() {
      return keys;
    },
    has(_, key) {
      if (typeof key !== 'string') return false;
      return accessors.has(key);
    },
    getOwnPropertyDescriptor(_, key) {
      if (typeof key === 'string') {
        //   source.get(key); // this is not a no-op!
        return {
          configurable: true,
          enumerable: true,
        };
      }
    },
  });
}

describe('observableRoot allows for async key+value lookup', () => {
  test('root tracks observability of props', async () => {
    let observedCount = 0;
    let unobservedCount = 0;

    const root = createRoot({
      source: observable.map<string, string>(),
      onObserved: key => (observedCount += 1),
      onUnobserved: key => (unobservedCount += 1),
    });

    expect(observedCount).toBe(0);
    expect(unobservedCount).toBe(0);

    expect(root.test).toBeUndefined();

    expect(observedCount).toBe(0);
    expect(unobservedCount).toBe(0);

    const disposer1 = autorun(() => {
      root.test;
    });

    const disposer2 = autorun(() => {
      root.test;
    });

    expect(observedCount).toBe(1);
    expect(unobservedCount).toBe(0);

    disposer1();

    expect(observedCount).toBe(1);
    expect(unobservedCount).toBe(0);

    disposer2();

    expect(observedCount).toBe(1);
    expect(unobservedCount).toBe(1);

    const disposer3 = autorun(() => {
      root.test;
    });

    expect(observedCount).toBe(2);
    expect(unobservedCount).toBe(1);

    disposer3();

    expect(observedCount).toBe(2);
    expect(unobservedCount).toBe(2);
  });

  test('set immediately to respond in sync', async () => {
    const root = createRoot({
      source: observable.map<string, string>(),
      onObserved: (key, set) => set('one'),
      onUnobserved: key => {},
    });

    const values: (string | undefined)[] = [];

    const disposer1 = autorun(() => {
      values.push(root.test);
    });

    expect(values).toEqual(['one']);

    disposer1();
  });

  test('set can update a value later', async () => {
    const root = createRoot({
      source: observable.map<string, string>(),
      onObserved: async (key, set) => {
        await new Promise(res => setTimeout(res, 5));
        set('one');
        await new Promise(res => setTimeout(res, 5));
        set('two');
        await new Promise(res => setTimeout(res, 5));
        set('three');
      },
      onUnobserved: key => {},
    });

    const values: (string | undefined)[] = [];

    const disposer1 = autorun(() => {
      values.push(root.test);
    });

    expect(values).toEqual([undefined]);
    await new Promise(res => setTimeout(res, 5));
    expect(values).toEqual([undefined, 'one']);
    await new Promise(res => setTimeout(res, 15));
    expect(values).toEqual([undefined, 'one', 'two', 'three']);

    disposer1();
  });

  test('set values fails', async () => {
    const root = createRoot({
      source: observable.map<string, string>(),
      onObserved: (key, set) => {},
      onUnobserved: key => {},
    });

    expect(() => (root.test = 'value')).toThrow();
  });

  test('exposes observed keys', async () => {
    const root = createRoot({
      source: observable.map<string, string>(),
      onObserved: (key, set) => {
        console.log(key);
      },
      onUnobserved: key => {},
    });

    expect(Object.keys(root)).toEqual([]);
    expect('key1' in root).toBe(false);

    const disposer1 = autorun(() => {
      root.key1;
    });

    expect('key1' in root).toBe(true);
    expect(Object.keys(root)).toEqual(['key1']);

    const disposer2 = autorun(() => {
      root.key2;
    });

    expect(Object.keys(root)).toEqual(['key1', 'key2']);

    disposer1();

    expect('key1' in root).toBe(false);
    expect(Object.keys(root)).toEqual(['key2']);

    disposer2();

    expect(Object.keys(root)).toEqual([]);
  });
});
