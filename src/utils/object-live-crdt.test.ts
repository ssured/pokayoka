import {
  action,
  observable,
  runInAction,
  toJS,
  ObservableMap,
  isObservableMap,
} from 'mobx';
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
  asReferenceOrEmbedded,
  serializeMany,
} from './object-live-crdt';
import { isEqual } from './index';
import { identifier } from '@babel/types';
import { string } from 'io-ts';

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

// function Many<T>(ctor: StaticConstructors<T>): StaticConstructors<ObservableMap<string, T>> {
//   @staticImplements<Many>()
//   class Many {
//     static '@type' = `Many<${ctor['@type']}>`;
//     constructor(readonly identifier: string) {}
//     static create = defaultCreate.bind(Many as any) as any;
//     static merge(card: Many, data: Partial<Serialized<Many>>) {
//       runInAction(() => {
//         // make a mutable copy of data
//         const update = { ...data } as Record<
//           string,
//           Partial<Serialized<T>> | null
//         >;

//         // remove not updateable properties
//         delete (update as any)['@type'];
//         delete update.identifier;

//         // check all references

//         for (const [id, incomingData] of Object.entries(update)) {
//           const currentValue = (card as any)[id] as any;

//           if (currentValue) {
//             if (incomingData) {
//               (currentValue.constructor as StaticConstructors<any>).merge(
//                 currentValue,
//                 incomingData
//               );
//             } else {
//               (card as any)[id] = null;
//               if (
//                 isEqual(pathOf(currentValue), [...(pathOf(card) || []), id])
//               ) {
//                 (currentValue.constructor as StaticConstructors<any>).destroy(
//                   currentValue
//                 );
//               }
//             }
//           } else if (incomingData) {
//             if (typeof incomingData.identifier === 'string') {
//               (card as any)[id] = ctor.create(incomingData as any);
//             }
//           }
//         }
//       });
//     }
//     static destroy(map: Many) {}

//     static serialize(map: Many): Record<string, Serialized<T>> {
//       const serialized = {} as any;
//       for (const [key, value] of Object.entries(map)) {
//         if (key === 'identifier') continue;
//         serialized[key] =
//           value == null ? null : asReferenceOrEmbedded(map, key as never);
//       }
//       return serialized;
//     }
//   }
//   return Many as any;
// }

// type Many<T> = Record<string, T>;

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

  test('create', () => {
    const state = observable.object<MergableSerialized<Mail>>({
      identifier: { '1': '123' },
      contents: {},
    });

    const card = create(getState, [], Mail, state);
    expect(toJS(card.contents)).toEqual({});
  });

  test.only('create and update internal', () => {
    state.set(1);

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
      '2': { card1: { '2': { contents: null, identifier: { '2': 'card1' } } } },
    });
  });

  test('create and update later', () => {
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
