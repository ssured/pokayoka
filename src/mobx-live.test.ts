import * as t from 'io-ts';
import {
  IObservableObject,
  observable,
  when,
  isObservableObject,
  runInAction,
  computed,
} from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { useEffect, useState } from 'react';
import console = require('console');

type Primitive = boolean | string | number | null;
type subj = string[];
type pred = string;
type objt = Primitive | string[] | [string[]];

const MapSymbol: unique symbol = Symbol();
interface MapObject {
  [MapSymbol]: MapObject;
}

type Many<T> = { [key: string]: T } & MapObject;
type ZeroOrOne<T> = T | null;
type One<T> = T;
type Compact<A> = { [K in keyof A]: A[K] };

interface Author {
  type: 'author';
  name: string;
  debut: One<Book>;
  books: Many<Book>;
}

interface Book {
  type: 'book';
  title: string;
  author: One<Author>;
}

type MobxNode<T extends object> = Readonly<
  {
    [K in keyof T]: T[K] extends Primitive
      ? T[K]
      : T[K] extends object
      ? T[K] extends Many<infer U>
        ? U extends object
          ? IPromiseBasedObservable<{
              [key: string]: IPromiseBasedObservable<MobxNode<U>>;
            }>
          : never
        : IPromiseBasedObservable<MobxNode<T[K]>>
      : never
  }
>;

test('observable new prop', async () => {
  const rawStore = observable<{ [key: string]: any }>({});

  function getAuthor(
    store: typeof rawStore,
    id: string
  ): IPromiseBasedObservable<MobxNode<Author>> {
    const rawAuthor = computed<RawAuthor>(() => store[id] || {});
    type AuthorNode = MobxNode<Author>;
    return fromPromise(
      when(() => RawAuthor.is(rawAuthor.get())).then(() => {
        const booksIds = computed<{ [key: string]: string[] }>(
          () => store[rawAuthor.get().books[0]]
        );
        return observable<AuthorNode>({
          get type() {
            return rawAuthor.get().type;
          },
          get name() {
            return rawAuthor.get().name;
          },
          get debut() {
            const id = rawAuthor.get().debut[0];
            return getBook(store, id);
          },
          get books() {
            rawAuthor.get().books[0];
            return fromPromise(
              when(
                () => booksIds.get() && typeof booksIds.get() === 'object'
              ).then(() => {
                return { s: getBook(store, 's') };
              })
            );
          },
        });
      })
    );
  }

  function getBook(
    store: typeof rawStore,
    id: string
  ): IPromiseBasedObservable<MobxNode<Book>> {
    const rawBook = computed<RawBook>(() => store[id] || {});

    return fromPromise(
      when(() => RawBook.is(rawBook.get())).then(() =>
        observable<MobxNode<Book>>({
          get type() {
            return rawBook.get().type;
          },
          get title() {
            return rawBook.get().title;
          },
          get author() {
            const id = rawBook.get().author[0];
            return getAuthor(store, id);
          },
        })
      )
    );
  }

  const author = getAuthor(rawStore, 'someId');

  Promise.resolve().then(() => {
    rawStore.someId = {
      type: 'author',
      name: 'test',
      debut: ['yo'],
      books: ['yo'],
    } as RawAuthor;
  });

  await when(() => author.state !== 'pending');

  expect(author.value.name).toBe('test');
}, 100);

type RawType<T extends object> = {
  [K in keyof T]: T[K] extends Primitive ? T[K] : subj
};

type OrNull<T> = T extends (infer U | null) ? U : never;

type test = OrNull<Book | null>;

type RawAuthor = RawType<Author>;
const RawAuthor: t.Type<RawAuthor> = t.type({
  type: t.literal('author'),
  name: t.string,
  debut: t.array(t.string),
  books: t.array(t.string),
});

type RawBook = RawType<Book>;
const RawBook: t.Type<RawBook> = t.type({
  type: t.literal('book'),
  title: t.string,
  author: t.array(t.string),
});

// async function* getPO(
//   subject: subj
// ): AsyncIterable<{ pred: pred; objt: objt }> {
//   yield { pred: 't', objt: 'data' };
// }

// async function* getRawObject<T extends t.Any>(
//   Type: T,
//   id: string
// ): AsyncIterable<t.TypeOf<T>> {
//   // load author from the db
//   const current: Record<string, objt> = {};
//   for await (const { pred, objt } of getPO([id, ''])) {
//     current[pred] = objt;
//     if (Type.is(current)) {
//       yield current;
//     }
//   }
// }

// type AsyncState<T> =
//   | {
//       state: 'waiting';
//     }
//   | { state: 'alive'; value: T }
//   | { state: 'error'; error: any };

// function useAsyncIterator<T, U>(
//   iterable: AsyncIterable<T>,
//   onData: (data: T) => U
// ) {
//   const [state, setState] = useState<AsyncState<U>>({ state: 'waiting' });
//   useEffect(() => {
//     let isDestroyed = false;
//     (async function() {
//       try {
//         for await (const data of iterable) {
//           if (isDestroyed) break;
//           const value = onData(data);
//           if (state.state !== 'alive' || state.value !== value) {
//             setState({ state: 'alive', value });
//           }
//         }
//       } catch (e) {
//         setState({ state: 'error', error: e });
//       }
//     })();
//     return () => (isDestroyed = true);
//   }, [iterable]);
//   return state;
// }

// type FromAsync<T> = T;

// type FromAsyncMap<T> = T;

// type Runtime<T extends object> = {
//   [K in keyof T]: T[K] extends Primitive
//     ? T[K]
//     : T[K] extends Many<infer U>
//     ? FromAsyncMap<U>
//     : FromAsync<T[K]>
// };

// // class Author implements Runtime<Author> {
// //     @observable
// //     private raw: RawType<Author>

// //     constructor(raw:RawType<Author>) {
// //         this.raw=raw
// //     }

// //     @computed
// // }

// const rawApi = {
//   authors: (id: string) => getRawObject(RawAuthor, id),
//   books: (id: string) => getRawObject(RawBook, id),
// };

// // type Book = t.TypeOf<ReturnType<typeof Book>>
// // type Author = t.TypeOf<ReturnType<typeof Author>>
// type BookOrAuthor = Book | Author;

// function test(ba: BookOrAuthor) {
//   if (ba.type === 'author') {
//     ba.books.abc.author;
//   } else {
//     ba;
//   }
// }

// export enum MessageType {
//   REQUEST,
//   WRITE,
//   TUPLE,
// }

// export interface RequestMessage {
//   type: MessageType.REQUEST;
//   s: subj;
// }

// export interface TupleMessage {
//   type: MessageType.TUPLE;
//   s: subj;
//   p: pred;
//   o: objt;
// }

// export type SPOMessage = RequestMessage | TupleMessage;

// declare global {
//   interface ActorMessageType {
//     uiState: SPOMessage;
//     // dbState: SPOMessage;
//   }
// }

// export interface State {
//   [key: string /* path [...subj, pred] */]: State | objt;
// }

// export class ObservableState extends Actor<SPOMessage> {
//   // private spoBroker = lookup("spoBroker");
//   public state = observable<State>({});

//   async onMessage(msg: SPOMessage) {
//     switch (msg.type) {
//       case MessageType.REQUEST:
//         // ignore requests
//         break;
//       case MessageType.TUPLE:
//         // write to the local observable state
//         runInAction(() => {
//           dset(this.state, msg.s.concat(msg.p), msg.o);
//         });
//         break;
//     }
//     // this.spoBroker.send({
//     //   state: this.state
//     // });
//   }

//   public request(id: string) {
//     // this.spoBroker.send({
//     //   type: MessageType.REQUEST,
//     //   s: [id]
//     // })
//   }
// }
