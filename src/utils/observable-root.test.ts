import {
  autorun,
  computed,
  IComputedValue,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
  ObservableMap,
  isObservableArray,
  isObservableSet,
  ObservableSet,
} from 'mobx';
import { Omit } from './typescript';
import SubscribableEvent from 'subscribableevent';
import { createRoot, getObservedKeys } from './observable-root';

describe('observableRoot allows for async key+value lookup', () => {
  test('root tracks observability of props', async () => {
    let observedCount = 0;
    let unobservedCount = 0;

    const root = createRoot({
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
    const root = createRoot<string>({
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
    const root = createRoot<string>({
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
    const rootNoSet = createRoot({
      onObserved: (key, set) => {},
      onUnobserved: key => {},
    });

    try {
      rootNoSet.test = 'value';
    } catch (e) {
      console.log(e);
    }
    expect(() => (rootNoSet.test = 'value')).toThrowError();
  });

  test('exposes observed keys', async () => {
    const root = createRoot({
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

    expect(isObservableArray(Object.keys(root))).toBe(false);
    expect(isObservableSet(getObservedKeys(root))).toBe(true);

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
