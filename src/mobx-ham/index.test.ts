import { hamObject, getDeepObservable } from './index';
import {
  isObservableObject,
  observable,
  observe,
  IObjectDidChange,
  configure,
  runInAction,
} from 'mobx';

configure({ enforceActions: 'strict', disableErrorBoundaries: false });

describe('mobx+ham', () => {
  it('sees changes', () => {
    type A = {
      test?: string;
    };

    const { obj: a, dispose: disposeA } = hamObject<A>({});

    a.test = 'value';

    expect(a._ham).toBeDefined();

    disposeA();
  });

  it('sees changes in maps', () => {
    type A = {
      test?: string;
      map?: Map<string, string | object>;
    };

    let state = 1;
    const { obj: a, dispose: disposeA } = hamObject<A>({}, () => state);

    a.test = 'value';
    expect(a._ham).toEqual({ test: 1 });

    state = 2;
    a.map = new Map();
    expect(a._ham).toEqual({
      test: 1,
      map: 2,
    });

    state = 3;
    runInAction(() => a.map!.set('k', 'v'));
    expect(a._ham).toEqual({
      test: 1,
      map: [2, { k: 3 }],
    });

    state = 4;
    runInAction(() => a.map!.set('.o', { k: 'v' }));

    expect(JSON.parse(JSON.stringify(a))).toEqual({
      _ham: {
        test: 1,
        map: [
          2,
          {
            k: 3,
            '.o': [4, { k: 4 }],
          },
        ],
      },
      test: 'value',
      map: { k: 'v', '.o': { k: 'v' } },
    });

    disposeA();
  });

  it('sees deep changes', () => {
    type A = {
      a?: string;
      sub?: {
        b?: string;
        c?: string;
      };
    };

    let state = 1;

    const { obj: a, dispose: disposeA } = hamObject<A>({}, () => state);

    expect(a).toEqual({
      _ham: {},
    });

    a.a = 'A';
    expect(a).toEqual({
      a: 'A',
      _ham: { a: 1 },
    });

    state = 2;

    a.sub = { b: 'data' };
    expect(a._ham).toEqual({
      a: 1,
      sub: [2, { b: 2 }],
    });

    state = 3;

    runInAction(() => (a.sub!.b = 'update'));
    expect(a._ham).toEqual({
      a: 1,
      sub: [2, { b: 3 }],
    });

    state = 4;
    runInAction(() => (a.sub = { c: 'update' }));
    expect(a._ham).toEqual({
      a: 1,
      sub: [4, { c: 4 }],
    });

    disposeA();
  });
});

describe('utils', () => {
  it('getDeepObservable', () => {
    const a = {};
    const b = getDeepObservable(a);

    expect(isObservableObject(a)).toBe(false);
    expect(isObservableObject(b)).toBe(true);
  });
});

describe('sandbox', () => {
  it('observe extendobservable', () => {
    const a = {} as { name?: string };
    const b = observable.object(a, {}, { deep: true });
    expect(a).not.toBe(b);

    // const b = observable.object(a);
    const changes: IObjectDidChange[] = [];
    observe(b, change => changes.push(change));
    b.name = 'tlest';
    expect(changes.length).toBe(1);
  });
});
