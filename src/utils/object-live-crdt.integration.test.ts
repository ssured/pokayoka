import { action, observable, configure, runInAction, toJS } from 'mobx';
import {
  create,
  staticImplements,
  MergableSerialized,
} from './object-live-crdt';
import nano from 'nano';
import { asMergeableObject, valueAt, merge, pickAt } from './object-crdt';
import { deepObserve } from 'mobx-utils';

const couch = nano('http://admin:admin@localhost:5984');
const testDbName = 'atest';

configure({ enforceActions: 'always' });

@staticImplements<User>()
class User {
  static '@type' = 'User';
  constructor(readonly identifier: string) {}

  static serialize(hello: User) {
    return {
      name: hello.name,
    };
  }

  @observable
  name = '';

  @action
  setName(name: string) {
    this.name = name;
  }
}

describe('one class', () => {
  const state = observable.box(1);
  const getState = () => String(state.get());
  let db!: nano.DocumentScope<unknown>;

  beforeAll(async () => {
    await new Promise(res => setTimeout(res, 50));

    const dbs = await couch.db.list();
    if (dbs.includes(testDbName)) {
      await couch.db.destroy(testDbName);
    }
    await couch.db.create(testDbName);
    db = couch.use(testDbName);
  });

  beforeEach(() => {
    runInAction(() => state.set(1));
  });

  test.only('create', async () => {
    const _id = 'user1';

    // create document
    await db.insert({
      _id,
      ...asMergeableObject(getState(), {
        '@type': 'User',
        identifier: _id,
        name: 'Sjoerd',
      }),
    });

    // start from db data
    const doc = await db.get(_id);
    const data = observable.object<Record<string, MergableSerialized<User>>>(
      doc as any
    );

    const hello = create(getState, [], User, data);

    const updates: Promise<any>[] = [];
    deepObserve(data, (change, path) => {
      const update = new Promise(async (res, rej) => {
        try {
          await Promise.all(updates);
          const current = await db.get(_id);
          merge(
            pickAt(getState(), current as any) as any,
            pickAt(getState(), toJS(data))!
          );
          res(db.insert(current));
        } catch (e) {
          rej(e);
        }
      }).finally(() => {
        const idx = updates.findIndex(u => u === update);
        if (idx > -1) {
          updates.splice(idx, 1);
        }
      });
      updates.push(update);
    });

    expect(hello.name).toEqual('Sjoerd');

    runInAction(() => state.set(2));
    hello.setName('Marieke');
    expect(updates.length).toBe(1);

    runInAction(() => state.set(3));
    hello.setName('Wieger');
    expect(updates.length).toBe(2);

    runInAction(() => state.set(5));
    hello.setName('Jolien');
    expect(updates.length).toBe(3);

    await Promise.all(updates);
  });
});
