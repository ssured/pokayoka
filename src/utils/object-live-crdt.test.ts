import { action, observable, toJS } from 'mobx';
import { create, staticImplements, Serialized } from './object-live-crdt';
import { subj } from './spo';
import { ToMergeableObject, merge } from './object-crdt';

export const HelloType = 'Hello' as const;

describe('one class', () => {
  @staticImplements<Hello>()
  class Hello {
    '@type' = HelloType;

    @observable
    greet = '';

    get GREET() {
      return this.greet.toUpperCase();
    }

    @action
    setGreet(greet: string) {
      this.greet = greet;
    }

    constructor(readonly path: subj) {}

    @action
    merge(current: Partial<Pick<Hello, PrimitiveKeys<Hello>>>) {
      Object.assign(this, current);
    }

    get serialized() {
      return {
        '@type': HelloType,
        greet: this.greet,
      };
    }
  }

  let state = observable.box(1);
  const getState = () => String(state.get());

  test('create', () => {
    const hello = create(
      getState,
      [],
      Hello,
      observable.object({
        '@type': { '1': 'Hello' as const },
        greet: { '1': 'yo' },
      })
    );

    expect(hello.greet).toEqual('yo');
    expect(hello.GREET).toEqual('YO');
  });

  test('update internal', () => {
    state = observable.box(1);

    const source = observable.object({
      '@type': { '1': 'Hello' as const },
      greet: { '1': 'yo' },
    });
    const hello = create(getState, [], Hello, source);

    state.set(2);

    hello.greet = 'hi';
    expect(hello.greet).toEqual('hi');
    expect(hello.GREET).toEqual('HI');

    expect(source).toEqual({
      '@type': { '1': 'Hello' as const },
      greet: { '1': 'yo', '2': 'hi' },
    });
  });

  test('update external', () => {
    state = observable.box(1);

    const source = observable.object<ToMergeableObject<Serialized<Hello>>>({
      '@type': { '1': 'Hello' as const },
      greet: { '1': 'yo' },
    });

    const hello = create(getState, [], Hello, source);

    expect(hello.greet).toEqual('yo');
    expect(hello.GREET).toEqual('YO');

    source.greet['2'] = 'hi';

    expect(hello.greet).toEqual('yo');
    expect(hello.GREET).toEqual('YO');

    state.set(2);

    expect(hello.greet).toEqual('hi');
    expect(hello.GREET).toEqual('HI');

    expect(toJS(source)).toEqual({
      '@type': { '1': 'Hello' as const },
      greet: { '1': 'yo', '2': 'hi' },
    });
  });
});
