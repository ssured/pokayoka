import { action, configure, observable, runInAction, toJS } from 'mobx';
import { deepObserve } from 'mobx-utils';
import nano from 'nano';
import { generateId } from '../../server/utils/snag-id';
import { asMergeableObject, merge, pickAt } from './object-crdt';
import {
  create,
  MergableSerialized,
  serializeMany,
  checkDefinitionOf,
  UniversalObject,
  many,
} from './object-live-crdt';

const couch = nano('http://admin:admin@localhost:5984');
const testDbName = 'atest';

configure({ enforceActions: 'always' });

abstract class Base extends UniversalObject {
  constructor(readonly identifier: string) {
    super(); // make ts-lint happy

    // initialization logic goes here
  }
}

@checkDefinitionOf<Project>()
class Project extends Base {
  static '@type' = 'Project';

  static serialize({ name }: Project) {
    return { name };
  }

  @observable
  name = '';

  @action
  setName(name: string) {
    this.name = name;
  }
}

@checkDefinitionOf<User>()
class User extends Base {
  static '@type' = 'User';

  static constructors = {
    projects: many(Project),
  };

  static serialize(user: User) {
    const { name } = user;
    return { name, ...serializeMany(user, 'projects') };
  }

  @observable
  name = '';

  @action
  setName(name: string) {
    this.name = name;
  }

  projects = observable.map<string, Project>();

  @action
  addProject(name: string) {
    const project = new Project(generateId());
    project.setName(name);
    this.projects.set(project.identifier, project);
    return project;
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

  test('create', async () => {
    const _id = 'user1';

    // create document
    await db.insert({
      _id,
      ...asMergeableObject(getState(), {
        '@type': 'User',
        identifier: _id,
        name: 'Sjoerd',
        projects: {},
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
      console.log(path);
      // @ts-ignore
      console.log(change.name);
      console.log(toJS(change));
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
    const project = hello.addProject('Wieger');
    expect(updates.length).toBe(2);

    runInAction(() => state.set(4));
    project.setName('Joliens');
    expect(updates.length).toBe(3);

    runInAction(() => state.set(5));
    hello.setName('Jolien');
    expect(updates.length).toBe(4);

    await Promise.all(updates);
  });
});
