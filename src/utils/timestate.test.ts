import charwise from 'charwise';
import {
  action,
  autorun,
  configure,
  observable,
  runInAction,
  IObservableValue,
  ObservableMap,
  toJS,
  reaction,
  when,
} from 'mobx';
import { isObject } from 'util';
import { generateId } from '../../server/utils/snag-id';
import {
  checkDefinitionOf,
  many,
  serializeMany,
  UniversalObject,
  MergableSerialized,
  mergeSerialized,
  Serialized,
  setPathOf,
  serializeOne,
} from './object-live-crdt';
import {
  createEmittingRoot,
  RootEventMsg,
  createRoot,
} from './observable-root';
import { isLink, subj } from './spo';
import SubscribableEvent, { SubscriptionToken } from 'subscribableevent';
import { ensureNever } from './index';
import { valueAt, IMergeable } from './object-crdt';

configure({ enforceActions: 'always', disableErrorBoundaries: true });

// state is global for the system
let state!: IObservableValue<number>;
const getState = () => String(state.get());

let timeState!: ObservableMap<
  string,
  Record<string, MergableSerialized<AnyInstance>>
>;

runInAction(() => {
  timeState = observable.map<
    string,
    Record<string, MergableSerialized<AnyInstance>>
  >([
    [
      path2key(['existing@example.com']),
      {
        '0': {
          name: {
            '0': 'Existing',
          },
          projects: {
            '0': {},
          },
        },
      } as any,
    ],
  ]);
});

function getTimeStateThread(identifier: string) {
  if (!timeState.has(identifier)) {
    runInAction(() => timeState.set(identifier, { '0': {} } as any));
  }
  return timeState.get(identifier)!;
}
function isTopLevel(key: string) {
  return key2path(key).length === 1;
}

abstract class Base extends UniversalObject {
  constructor(readonly identifier: string) {
    super();

    // only sync on top level objects
    // deeper objects will be synced from top
    if (!isTopLevel(identifier)) return;

    // TODO remove path logic and use identifier for all paths
    setPathOf(this, key2path(identifier));
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
    defaultProject: Project,
  };

  static serialize(user: User) {
    const { name } = user;
    return {
      name,
      ...serializeMany(user, 'projects'),
      ...serializeOne(user, 'defaultProject'),
    };
  }

  @observable
  name = '';

  @action
  setName(name: string) {
    this.name = name;
  }

  @observable
  defaultProject?: Project;

  projects = observable.map<string, Project>();

  @action
  addProject(id: string, name: string) {
    const key = path2key([this.identifier, 'projects', id]);
    const project = new Project(key);
    project.setName(name);
    this.projects.set(project.identifier, project);
    return project;
  }

  @action
  selectProject(project?: Project) {
    this.defaultProject = project;
  }
}

// Helpers for the shape of internal state
type AnyClass = typeof User | typeof Project;
type AnyInstance = InstanceType<AnyClass>;
const rootShape = many(User);
const lookupClassFromPath = (path: subj): AnyClass => {
  if (path.length === 0) throw new Error('root has no constructor');
  let ctor = rootShape as any;

  for (const part of path) {
    if (!isObject(ctor.constructors)) {
      throw new Error(
        `could not find constructors at path ${JSON.stringify(path)}`
      );
    }
    ctor = ctor.constructors[part];
    if (!ctor || typeof ctor['@type'] !== 'string') {
      throw new Error(
        `no or wrong constructor at path ${JSON.stringify(path)}`
      );
    }
  }

  return ctor;
};
function key2path(key: string): subj {
  let path!: subj | unknown;
  try {
    path = charwise.decode(key) as unknown;
  } catch (e) {
    throw new Error(`Key is properly encoded: ${key}`);
  }
  if (!isLink(path)) {
    throw new Error(`key is not a valid path ${JSON.stringify(key)}`);
  }
  return path;
}
function path2key(path: subj): string {
  return charwise.encode(path);
}

const timeStateHandler = () => {
  const disposersMap: Record<string, (() => void)[]> = {};
  const instancesMap = observable.map<string, AnyInstance>();
  return async (msg: RootEventMsg<AnyInstance>) => {
    const { key } = msg;
    if (!isTopLevel(key)) return;

    switch (msg.type) {
      case 'observed': {
        const store = getTimeStateThread(key);

        let mutexLocked = false;

        disposersMap[key] = [];
        disposersMap[key].push(
          reaction(
            () => valueAt(getState(), store) as Partial<Serialized<any>>,
            current => {
              const instance = instancesMap.get(key);
              if (current == null || instance == null || mutexLocked) {
                return;
              }
              const Class = instance.constructor as any;

              try {
                mutexLocked = true;
                Class.merge(instance, current);
              } finally {
                mutexLocked = false;
              }
            },
            { fireImmediately: true }
          )
        );

        disposersMap[key].push(
          reaction(
            () => {
              const instance = instancesMap.get(key);
              if (instance == null) return;
              const Class = instance.constructor as any;
              return Class.serialize(instance);
            },
            serialized => {
              if (serialized == null || mutexLocked) return;
              try {
                mutexLocked = true;
                mergeSerialized(getState(), store, serialized);
              } finally {
                mutexLocked = false;
              }
            },
            { fireImmediately: false }
          )
        );

        break;
      }

      case 'unobserved':
        disposersMap[key].forEach(disposer => disposer());
        break;
      case 'update':
        runInAction(() => instancesMap.set(key, msg.value));
        break;
      default:
        ensureNever(msg);
    }
  };
};

describe('one class', () => {
  type Message = RootEventMsg<AnyInstance>;
  let root!: Record<string, AnyInstance>;
  let subscribe!: (callback: (msg: Message) => void) => SubscriptionToken;

  beforeEach(() => {
    state = observable.box(1);
    const rootBag = createEmittingRoot<AnyInstance>({
      onObserved: (key, set) =>
        runInAction(() => {
          const Class = lookupClassFromPath(key2path(key));
          const instance = new Class(key);
          set(instance);
        }),
    });
    root = rootBag.root;
    subscribe = rootBag.subscribe;
  });

  test('it allows external updates', async () => {
    subscribe(timeStateHandler());

    const username = 'test@example.com';
    const key = path2key([username]);

    const keepAlive = when(() => root[key].name === 'done');

    const user = root[key] as User;
    expect(user.name).toBe('');

    runInAction(() => state.set(2));
    user.setName('Two');
    expect(toJS(timeState)).toMatchSnapshot();
    // console.log(toJS(globalStore));

    runInAction(() => state.set(3));
    user.setName('Three');
    expect(toJS(timeState)).toMatchSnapshot();

    mergeSerialized('4', getTimeStateThread(key), { name: 'Four' });

    expect(user.name).toBe('Three');
    runInAction(() => state.set(4));
    expect(user.name).toBe('Four');

    setTimeout(() => root[key]!.setName('done'), 10);

    // expect(1).toBe(2)

    await keepAlive;
    console.log('done');
  });

  test('it supports one to many', async () => {
    subscribe(timeStateHandler());

    const username = 'existing@example.com';
    const key = path2key([username]);

    const keepAlive = when(() => root[key].name === 'done');

    const user = root[key] as User;
    expect(user.name).toBe('Existing');

    runInAction(() => state.set(2));
    user.addProject('p1', 'Two');
    expect(toJS(timeState)).toMatchSnapshot();

    runInAction(() => state.set(3));
    user.projects
      .values()
      .next()
      .value.setName('Three');
    expect(toJS(timeState)).toMatchSnapshot();

    setTimeout(() => root[key]!.setName('done'), 10);

    // expect(1).toBe(2)

    await keepAlive;
    console.log('done');
  });

  test.only('it supports zero or one', async () => {
    subscribe(timeStateHandler());

    const username = 'existing@example.com';
    const key = path2key([username]);

    const keepAlive = when(() => root[key].name === 'done');

    const user = root[key] as User;
    expect(user.name).toBe('Existing');

    runInAction(() => state.set(2));
    const project = user.addProject('p1', 'Two');

    expect(toJS(timeState)).toMatchSnapshot();

    runInAction(() => state.set(3));
    user.projects
      .values()
      .next()
      .value.setName('Three');
    user.selectProject(project);
    expect(toJS(timeState)).toMatchSnapshot();

    setTimeout(() => root[key]!.setName('done'), 10);

    // expect(1).toBe(2)

    await keepAlive;
    console.log('done');
  });
});
