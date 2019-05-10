import {
  computed,
  IComputedValue,
  isObservableSet,
  observable,
  ObservableMap,
  ObservableSet,
  onBecomeObserved,
  onBecomeUnobserved,
  runInAction,
} from 'mobx';
import SubscribableEvent from 'subscribableevent';
import { Omit } from './typescript';

const observedKeys = Symbol('root observed keys');

export type RootHandler<T> = {
  source?: ObservableMap<string, T>;

  requestSet?: (key: string, value: T) => boolean;

  onObserved: (key: string, set: (value: T) => void) => void;
  onSet?: (key: string, value: T) => void;
  onUnobserved: (key: string) => void;
};

export function getObservedKeys(
  root: Record<string, any>
): ObservableSet<string> {
  const keys = ((root as any) || {})[observedKeys];
  if (!keys || !isObservableSet(keys)) throw new Error('root is not a Root');
  return keys;
}

export function createRoot<T>({
  source = observable.map<string, T>(),
  requestSet = () => false,

  onObserved,
  onUnobserved,
  onSet = () => {},
}: RootHandler<T>): Record<string, T | undefined> {
  const disposers: (() => void)[] = [];

  const accessors = observable.map<
    string,
    IComputedValue<T | undefined> | undefined
  >();

  const keys = observable.set<string>();
  let keysArrayIsWritable = false;
  disposers.push(
    keys.intercept(change => (keysArrayIsWritable ? change : null))
  );

  disposers.push(
    accessors.observe(change => {
      switch (change.type) {
        case 'add': {
          keysArrayIsWritable = true;
          runInAction(() => keys.add(change.name));
          keysArrayIsWritable = false;
          break;
        }
        case 'delete': {
          keysArrayIsWritable = true;
          runInAction(() => keys.delete(change.name));
          keysArrayIsWritable = false;
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
      onObserved(key, (value: T) => {
        source.set(key, value);
        onSet(key, value);
      })
    );
    onBecomeUnobserved(accessor, () => {
      accessors.delete(key);
      onUnobserved(key);
    });

    return accessor;
  }

  return new Proxy(Object.create(null) as any, {
    get(target, key) {
      if (key === observedKeys) return keys;

      if (typeof key !== 'string') return undefined;
      return getAccessor(key).get();
    },
    set(target, key, value) {
      if (typeof key !== 'string') return false;
      const setOk = requestSet(key, value);
      if (setOk) onSet(key, value);
      return setOk;
    },
    ownKeys() {
      return [...keys.values()];
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

export type RootEventMsg<T> =
  | {
      type: 'observed';
      key: string;
      set: (value: T) => void;
    }
  | {
      type: 'update';
      key: string;
      value: T;
    }
  | {
      type: 'unobserved';
      key: string;
    };

export function createEmittingRoot<T>(
  handler: Omit<RootHandler<T>, 'onObserved' | 'onUnobserved' | 'onSet'> &
    Partial<Pick<RootHandler<T>, 'onObserved' | 'onUnobserved' | 'onSet'>>
) {
  const emitter = new SubscribableEvent<(msg: RootEventMsg<T>) => void>();

  const root = createRoot({
    ...handler,
    onObserved: (key, set) => {
      handler.onObserved && handler.onObserved(key, set);
      emitter.fire({ type: 'observed', key, set });
    },
    onUnobserved: key => {
      handler.onUnobserved && handler.onUnobserved(key);
      emitter.fire({ type: 'unobserved', key });
    },
    onSet: (key, value) => {
      handler.onSet && handler.onSet(key, value);
      emitter.fire({ type: 'update', key, value });
    },
  });

  return {
    root,
    subscribe: emitter.subscribe.bind(emitter),
  };
}