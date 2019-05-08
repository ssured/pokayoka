import { action, observable, configure, runInAction } from 'mobx';
import {
  create,
  staticImplements,
  MergableSerialized,
} from './object-live-crdt';
import nano from 'nano';
import { asMergeableObject, valueAt, merge } from './object-crdt';

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

  test('create', async () => {
    const _id = 'user1';
    const initial = asMergeableObject(getState(), {
      '@type': 'User',
      identifier: _id,
      name: 'Sjoerd',
    });

    initial; // ?
    valueAt(getState(), initial); // ?
    expect(valueAt(getState(), initial)!.identifier).toBe('user1');

    await db.insert({ _id, ...initial });

    const data = observable.object<Record<string, MergableSerialized<User>>>(
      initial
    );
    const hello = create(getState, [], User, data);

    expect(hello.name).toEqual('Sjoerd');
  });
});
