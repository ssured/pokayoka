import {
  types as t,
  resolveIdentifier,
  getSnapshot,
  Instance,
  getPath,
  SnapshotOrInstance,
  destroy,
} from 'mobx-state-tree';

import { Request, Notification } from './index';
import {
  baseProperties,
  baseActions,
  BaseRoot,
  baseRootEnv as env,
} from './base';
import { referenceHandler } from './utils';

import { ensureNever } from '../utils';

describe('mixing reference and objects works', () => {
  const Author = t
    .model('Author', { ...baseProperties, name: t.string })
    .actions(baseActions)
    .actions(self => ({
      setName(name: string) {
        self.name = name;
      },
    }));

  const AuthorRefOrObject = t.reference(Author, referenceHandler);

  const Book = t
    .model('Book', {
      ...baseProperties,
      title: t.string,
      author: t.maybeNull(AuthorRefOrObject),
    })
    .actions(baseActions)
    .actions(self => ({
      setTitle(title: string) {
        self.title = title;
      },
      setAuthor(author: null | string | SnapshotOrInstance<typeof Author>) {
        // fix typescript complaining about afterCreate property
        self.author = (typeof author === 'string'
          ? resolveIdentifier(Author, self, author) || null
          : author) as any;
      },
    }));

  const AnyModel = t.union(Author, Book);

  const Store = BaseRoot.named('Store')
    .props({
      data: t.map(AnyModel),
    })
    .actions(self => ({
      putData(data: SnapshotOrInstance<typeof AnyModel>) {
        const { _id } = data;

        // ensure the object lives at store level
        const obj = resolveIdentifier(AnyModel, self, _id);

        return self.data.put(data as any);
      },
    }));

  let store: Instance<typeof Store>;

  afterEach(() => {
    store && destroy(store);
  });

  test('no ref', () => {
    store = Store.create({
      data: {
        b1: {
          _id: 'b1',
          title: 'A Brief History of Time',
        },
      },
    });
    const book = resolveIdentifier(Book, store, 'b1');
    expect(book).toBeDefined();
    expect(book!.title).toBe('A Brief History of Time');
  });

  test('ref', () => {
    store = Store.create({
      data: {
        b1: {
          _id: 'b1',
          title: 'A Brief History of Time',
          author: 'a',
        },
        a: {
          _id: 'a',
          name: 'Stephen Hawking',
        },
      },
    });
    const book = resolveIdentifier(Book, store, 'b1');
    expect(book).toBeDefined();

    expect(book!.author).toBeDefined();
    expect(book!.title).toBe('A Brief History of Time');
    expect(book!.author).toBeDefined();
    expect(book!.author!.name).toBe('Stephen Hawking');

    const author = resolveIdentifier(Author, store, 'a');
    expect(author).toBeDefined();
    expect(author!.name).toBe('Stephen Hawking');
  });

  test('nested', () => {
    store = Store.create({
      data: {
        b1: {
          _id: 'b1',
          title: 'A Brief History of Time',
          author: 'a',
        },
        a: {
          _id: 'a',
          name: 'Stephen Hawking',
        },
      },
    });
    const book = resolveIdentifier(Book, store, 'b1');
    expect(book).toBeDefined();
    expect(book!.author).toBeDefined();
    expect(book!.author!.name).toBe('Stephen Hawking');

    const author = resolveIdentifier(Author, store, 'a');
    expect(author).toBeDefined();
    expect(author!.name).toBe('Stephen Hawking');
  });

  test('nested and referenced', () => {
    store = Store.create({
      data: {
        b1: {
          _id: 'b1',
          title: 'A Brief History of Time',
          author: 'a',
        },
        b2: {
          _id: 'b2',
          title: 'Brief Answers to the Big Questions',
          author: 'a',
        },
        a: {
          _id: 'a',
          name: 'Stephen Hawking',
        },
      },
    });
    const book1 = resolveIdentifier(Book, store, 'b1');
    expect(book1).toBeDefined();
    expect(book1!.author).toBeDefined();
    expect(book1!.author!.name).toBe('Stephen Hawking');

    const book2 = resolveIdentifier(Book, store, 'b2');
    expect(book2).toBeDefined();
    expect(book2!.title).toBe('Brief Answers to the Big Questions');
    expect(book2!.author).toBeDefined();
    expect(book2!.author!.name).toBe('Stephen Hawking');

    const author = resolveIdentifier(Author, store, 'a');
    expect(author).toBeDefined();
    expect(author!.name).toBe('Stephen Hawking');
  });

  test('request -> response', async () => {
    store = Store.create(
      {
        data: {
          b1: {
            _id: 'b1',
            title: 'A Brief History of Time',
            author: 'a',
          },
        },
      },
      env
    );

    const fetchRequests: Request[] = [];

    store.requests.subscribe(request => {
      switch (request.type) {
        case 'fetch':
          fetchRequests.push(request);
          break;
        default:
          ensureNever(request.type);
      }
    });

    const book = resolveIdentifier(Book, store, 'b1');
    expect(book).toBeDefined();

    expect(fetchRequests.length).toBe(0);

    expect(book!.author).toBeUndefined();

    await new Promise(res => setTimeout(res, 10));

    expect(fetchRequests.length).toBe(1);

    store.notify({
      type: 'fetch',
      id: 'a',
      snapshot: {
        _id: 'a',
        name: 'Stephen Hawking',
      },
    });

    expect(book!.author).toBeDefined();
    expect(book!.author!.name).toBe('Stephen Hawking');
  });

  // test.skip('notifies changes', () => {
  //   store = Store.create(
  //     {
  //       data: {
  //         b1: {
  //           _id: 'b1',
  //           title: 'A Brief History of Time',
  //           author: {
  //             _id: 'a',
  //             name: 'Stephen Hawking',
  //           },
  //         },
  //       },
  //     },
  //     env
  //   );

  //   const updates: Notification[] = [];

  //   store.notifications.subscribe(message => {
  //     switch (message.type) {
  //       case 'update':
  //         updates.push(message);
  //         break;
  //       default:
  //         ensureNever(message.type);
  //     }
  //   });

  //   const book = resolveIdentifier(Book, store, 'b1');
  //   expect(book).toBeDefined();

  //   expect(book!.author).toBeDefined();
  //   expect(book!.author!.name).toBe('Stephen Hawking');

  //   expect(updates.length).toBe(0);

  //   book!.setTitle('Short history');

  //   expect(updates[updates.length - 1].snapshot.title).toBe('Short history');

  //   expect(updates.length).toBe(1);
  // });
});
