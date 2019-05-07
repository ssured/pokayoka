import { action, observable, runInAction, toJS } from 'mobx';
import { generateId } from './id';
import { asMergeableObject, merge } from './object-crdt';
import {
  create,
  MergableSerialized,
  Serialized,
  serializeOne,
  StaticConstructors,
  staticImplements,
  defaultCreate,
  pathOf,
  defaultMerge,
} from './object-live-crdt';
import { isEqual } from './index';

@staticImplements<Hello>()
class Hello {
  static '@type' = 'Hello';
  constructor(readonly identifier: string) {}
  static create = defaultCreate.bind(Hello as any) as any;
  static merge = defaultMerge.bind(Hello as any) as any;
  static destroy(hello: Hello) {}

  static serialize(hello: Hello) {
    return {
      greet: hello.greet,
    };
  }

  @observable
  greet = '';

  get GREET() {
    return this.greet.toUpperCase();
  }

  @action
  setGreet(greet: string) {
    this.greet = greet;
  }
}

@staticImplements<Card>()
class Card {
  static '@type' = 'Card';
  constructor(readonly identifier: string) {}
  static create = defaultCreate.bind(Card as any) as any;
  static merge = defaultMerge.bind(Card as any) as any;
  static destroy(card: Card) {}

  static constructors = {
    contents: Hello,
  };

  static serialize(card: Card) {
    return {
      ...serializeOne(card, 'contents'),
    };
  }

  @observable
  contents?: Hello;
}

describe('one class', () => {
  let state = observable.box(1);
  const getState = () => String(state.get());

  test('create', () => {
    const hello = create(
      getState,
      [],
      Hello,
      observable.object({
        '@type': { '1': 'Hello' as const },
        identifier: { '1': 'yo' },
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
      identifier: { '1': 'yo' },
      greet: { '1': 'yo' },
    });
    const hello = create(getState, [], Hello, source);

    state.set(2);

    hello.greet = 'hi';
    expect(hello.greet).toEqual('hi');
    expect(hello.GREET).toEqual('HI');

    expect(source).toEqual({
      '@type': { '1': 'Hello' as const },
      identifier: { '1': 'yo' },
      greet: { '1': 'yo', '2': 'hi' },
    });
  });

  test('update external', () => {
    state = observable.box(1);

    const source = observable.object({
      '@type': { '1': 'Hello' as const },
      identifier: { '1': 'yo' },
      greet: { '1': 'yo' },
    });

    const hello = create(getState, [], Hello, source);

    expect(hello.greet).toEqual('yo');
    expect(hello.GREET).toEqual('YO');

    (source as any).greet['2'] = 'hi';

    expect(hello.greet).toEqual('yo');
    expect(hello.GREET).toEqual('YO');

    state.set(2);

    expect(hello.greet).toEqual('hi');
    expect(hello.GREET).toEqual('HI');

    expect(toJS(source)).toEqual({
      '@type': { '1': 'Hello' as const },
      identifier: { '1': 'yo' },
      greet: { '1': 'yo', '2': 'hi' },
    });
  });
});

describe('optional ref another class', () => {
  const state = observable.box(1);
  const getState = () => String(state.get());

  test('create', () => {
    const state = observable.object({
      '@type': { '1': 'Card' as const },
      identifier: { '1': '123' },
      contents: {
        '1': {
          '@type': { '1': 'Hello' as const },
          identifier: { '1': '1234' },
          greet: { '1': 'yo' },
        },
      },
    });

    const card = create(getState, [], Card, state);
    expect((card.contents as any).constructor['@type']).toEqual('Hello');
    expect(card.contents!.greet).toEqual('yo');
    expect(card.contents!.GREET).toEqual('YO');
  });

  test('create and update later', () => {
    const source = observable.object<MergableSerialized<Card>>({
      // '@type': { '1': 'Card' as const },
      identifier: { '1': '123' },
      contents: {},
    });

    const card = create(getState, [], Card, source);
    expect(card.contents).toBeFalsy();

    runInAction(() => {
      // @ts-ignore
      merge(source, {
        contents: asMergeableObject('2', {
          identifier: '432',
          greet: 'yo',
        }),
      });
    });

    expect(card.contents).toBeFalsy();

    runInAction(() => state.set(2));

    expect((card.contents as any).constructor['@type']).toEqual('Hello');
    expect(card.contents!.greet).toEqual('yo');
    expect(card.contents!.GREET).toEqual('YO');

    runInAction(() => {
      // @ts-ignore
      merge(source, {
        contents: asMergeableObject('3', null),
      });
    });

    expect((card.contents as any).constructor['@type']).toEqual('Hello');
    expect(card.contents!.greet).toEqual('yo');
    expect(card.contents!.GREET).toEqual('YO');

    runInAction(() => state.set(3));

    expect(card.contents).toBeFalsy();
  });
});
