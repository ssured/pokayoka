import { action, isObservableMap, observable, runInAction, toJS } from 'mobx';
import { asMergeableObject, merge } from './object-crdt';
import {
  create,
  defaultCreate,
  defaultMerge,
  MergableSerialized,
  serializeMany,
  serializeOne,
  staticImplements,
} from './object-live-crdt';

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

@staticImplements<Mail>()
class Mail {
  static '@type' = 'Mail';
  constructor(readonly identifier: string) {}
  static create = defaultCreate.bind(Mail as any) as any;
  static merge = defaultMerge.bind(Mail as any) as any;
  static destroy(card: Mail) {}

  static constructors = {
    contents: Card,
  };

  static serialize(card: Mail) {
    return {
      ...serializeMany(card, 'contents'),
    };
  }

  @observable
  contents = observable.map<string, Card>({});
}

describe('optional many another class', () => {
  const state = observable.box(1);
  const getState = () => String(state.get());

  beforeEach(() => {
    state.set(1);
  });

  test('create', () => {
    const state = observable.object<MergableSerialized<Mail>>({
      identifier: { '1': '123' },
      contents: {},
    });

    const card = create(getState, [], Mail, state);
    expect(toJS(card.contents)).toEqual({});
  });

  test('create and update internal', () => {
    const data = observable.object<MergableSerialized<Mail>>({
      identifier: { '1': '123' },
      contents: {},
    });

    const card = create(getState, [], Mail, data);
    expect(toJS(card.contents)).toEqual({});

    expect(data.contents).toEqual({});

    state.set(2);

    card.contents.set('card1', Card.create({ identifier: 'card1' }));

    expect(toJS(card.contents)).toEqual({
      card1: {
        identifier: 'card1',
        contents: undefined,
      },
    });

    expect(toJS(data.contents)).toEqual({
      '2': {
        card1: {
          '2': {
            '@type': { '2': 'Card' },
            contents: null,
            identifier: { '2': 'card1' },
          },
        },
      },
    });
  });

  test('create and update external', () => {
    const source = observable.object<MergableSerialized<Mail>>({
      identifier: { '1': '123' },
      contents: {},
    });

    const card = create(getState, [], Mail, source);

    expect(isObservableMap(card.contents)).toBe(true);

    runInAction(() => {
      // @ts-ignore
      merge(source, {
        contents: asMergeableObject('2', {
          card1: {
            identifier: 'c1',
            contents: {
              identifier: '432',
              greet: 'yo',
            },
          },
        }),
      });
    });

    expect(toJS(card.contents)).toEqual({});

    runInAction(() => state.set(2));

    expect(card.contents.get('card1')!.contents!.greet).toEqual('yo');
    expect((card.contents.get('card1')! as any).constructor['@type']).toEqual(
      'Card'
    );
    expect(card.contents.get('card1')!.contents!.GREET).toEqual('YO');

    runInAction(() => {
      // @ts-ignore
      merge(source, {
        contents: asMergeableObject('3', null),
      });
    });

    expect(card.contents.get('card1')!.contents!.greet).toEqual('yo');
    expect(
      (card.contents.get('card1')!.contents as any).constructor['@type']
    ).toEqual('Hello');

    runInAction(() => state.set(3));

    expect(toJS(card.contents)).toEqual({});

    runInAction(() => state.set(4));
  });
});
