import { action, isObservableMap, observable, runInAction, toJS } from 'mobx';
import { asMergeableObject, merge, pickAt } from './object-crdt';
import {
  create,
  MergableSerialized,
  serializeMany,
  serializeOne,
  staticImplements,
  many,
  Base,
  Serialized,
} from './object-live-crdt';

@staticImplements<Hello>()
class Hello extends Base {
  static '@type' = 'Hello';

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
class Card extends Base {
  static '@type' = 'Card';

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
        '1': {
          '@type': { '1': 'Hello' as const },
          identifier: { '1': 'yo' },
          greet: { '1': 'yo' },
        },
      })
    );

    expect(hello.greet).toEqual('yo');
    expect(hello.GREET).toEqual('YO');
  });

  test('update internal', () => {
    state = observable.box(1);

    const source = observable.object({
      '1': {
        '@type': { '1': 'Hello' as const },
        identifier: { '1': 'yo' },
        greet: { '1': 'yo' },
      },
    });
    const hello = create(getState, [], Hello, source);

    state.set(2);

    hello.greet = 'hi';
    expect(hello.greet).toEqual('hi');
    expect(hello.GREET).toEqual('HI');

    expect(toJS(source)).toEqual({
      '1': {
        '@type': { '1': 'Hello' as const },
        identifier: { '1': 'yo' },
        greet: { '1': 'yo', '2': 'hi' },
      },
    });
  });

  test('update external', () => {
    state = observable.box(1);

    const source = observable.object({
      '1': {
        '@type': { '1': 'Hello' as const },
        identifier: { '1': 'yo' },
        greet: { '1': 'yo' },
      },
    });

    const hello = create(getState, [], Hello, source);

    expect(hello.greet).toEqual('yo');
    expect(hello.GREET).toEqual('YO');

    (source as any)['1'].greet['2'] = 'hi';

    expect(hello.greet).toEqual('yo');
    expect(hello.GREET).toEqual('YO');

    state.set(2);

    expect(hello.greet).toEqual('hi');
    expect(hello.GREET).toEqual('HI');

    expect(toJS(source)).toEqual({
      '1': {
        '@type': { '1': 'Hello' as const },
        identifier: { '1': 'yo' },
        greet: { '1': 'yo', '2': 'hi' },
      },
    });
  });
});

describe('optional ref another class', () => {
  const state = observable.box(1);
  const getState = () => String(state.get());

  test('create', () => {
    const state = observable.object({
      '1': {
        '@type': { '1': 'Card' as const },
        identifier: { '1': '123' },
        contents: {
          '1': {
            '@type': { '1': 'Hello' as const },
            identifier: { '1': '1234' },
            greet: { '1': 'yo' },
          },
        },
      },
    });

    const card = create(getState, [], Card, state);
    expect((card.contents as any).constructor['@type']).toEqual('Hello');
    expect(card.contents!.greet).toEqual('yo');
    expect(card.contents!.GREET).toEqual('YO');
  });

  test('create and update later', () => {
    const source = observable.object<Record<string, MergableSerialized<Card>>>({
      '1': {
        // '@type': { '1': 'Card' as const },
        identifier: { '1': '123' },
        contents: {},
      },
    });

    const card = create(getState, [], Card, source);
    expect(card.contents).toBeFalsy();

    runInAction(() => {
      // @ts-ignore
      merge(pickAt(getState(), source), {
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
      merge(pickAt(getState(), source), {
        contents: asMergeableObject('3', null as any),
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
class Mail extends Base {
  static '@type' = 'Mail';

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
    const state = observable.object<Record<string, MergableSerialized<Mail>>>({
      '1': {
        identifier: { '1': '123' },
        contents: {},
      },
    });

    const card = create(getState, [], Mail, state);
    expect(toJS(card.contents)).toEqual({});
  });

  test('create and update internal', () => {
    const data = observable.object<Record<string, MergableSerialized<Mail>>>({
      '1': {
        identifier: { '1': '123' },
        contents: {},
      },
    });

    const card = create(getState, [], Mail, data);
    expect(toJS(card.contents)).toEqual({});

    expect(data['1'].contents).toEqual({});

    state.set(2);

    card.contents.set('card1', new Card('card1'));

    expect(toJS(card.contents)).toEqual({
      card1: {
        identifier: 'card1',
        contents: undefined,
      },
    });

    expect(toJS(data['1'].contents)).toEqual({
      '2': {
        card1: {
          '2': {
            '@type': { '2': 'Card' },
            contents: { '2': null },
            identifier: { '2': 'card1' },
          },
        },
      },
    });
  });

  test('create and update external', () => {
    const source = observable.object<Record<string, MergableSerialized<Mail>>>({
      '1': {
        identifier: { '1': '123' },
        contents: {},
      },
    });

    const card = create(getState, [], Mail, source);

    expect(isObservableMap(card.contents)).toBe(true);

    runInAction(() => {
      // @ts-ignore
      merge(pickAt(getState(), source), {
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
      merge(pickAt(getState(), source)!, {
        contents: asMergeableObject('3', null as any),
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
