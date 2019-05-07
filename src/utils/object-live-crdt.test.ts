import { action, observable, runInAction, toJS, IObservableObject } from 'mobx';
import { generateId } from './id';
import {
  create,
  Serialized,
  serializeOne,
  StaticConstructors,
  staticImplements,
  MergableSerialized,
} from './object-live-crdt';
import { merge, asMergeableObject } from './object-crdt';
import console = require('console');
import { current } from '../../server/wss/level';

@staticImplements<Hello>()
class Hello {
  static '@type' = 'Hello';

  constructor(readonly identifier: string) {}

  static create(data: Partial<Serialized<Hello>>) {
    const instance = new this(data.identifier || generateId());
    this.merge(instance, data);
    return instance;
  }
  static merge(hello: Hello, data: Partial<Serialized<Hello>>) {
    runInAction(() => Object.assign(hello, data));
  }
  static serialize(hello: Hello) {
    return {
      greet: hello.greet,
    };
  }
  static destroy(hello: Hello) {}

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

  static create(data: Partial<Serialized<Card>>) {
    const instance = new this(data.identifier || generateId());
    this.merge(instance, data);
    return instance;
  }
  static serialize(card: Card) {
    return {
      ...serializeOne(card, 'contents'),
    };
  }
  static merge(card: Card, data: Partial<Serialized<Card>>) {
    runInAction(() => {
      // make a mutable copy of data
      const update: Partial<Serialized<Card>> = { ...data };

      // remove not updateable properties
      delete (update as any)['@type'];
      delete update.identifier;

      // check all references
      for (const [prop, ctor] of Object.entries(this.constructors)) {
        const incomingData = (data as any)[prop] as any;
        delete (update as any)[prop];

        const currentValue = (card as any)[prop] as any;

        if (currentValue) {
          if (incomingData) {
            (currentValue.constructor as StaticConstructors<any>).merge(
              currentValue,
              incomingData
            );
          } else {
            (card as any)[prop] = null;
            (currentValue.constructor as StaticConstructors<any>).destroy(
              currentValue
            );
          }
        } else if (incomingData) {
          (card as any)[prop] = ctor.create(incomingData);
        }
      }

      // assign remaining values, which should all be primitives
      Object.assign(card, update);
    });
  }
  static destroy(card: Card) {}
  static constructors = {
    contents: Hello,
  };

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
