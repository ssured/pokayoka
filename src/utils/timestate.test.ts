import {
  action,
  configure,
  IObservableValue,
  observable,
  reaction,
  runInAction,
  toJS,
  autorun,
  when,
} from 'mobx';
import { generateId } from './id';
import { ensureNever } from './index';
import { valueAt } from './object-crdt';
import {
  checkDefinitionOf,
  many,
  MergableSerialized,
  mergeSerialized,
  Serialized,
  serializeMany,
  serializeOne,
  UniversalObject,
} from './object-live-crdt';
import { createEmittingRoot, RootEventMsg } from './observable-root';

configure({ enforceActions: 'observed', disableErrorBoundaries: true });

// state is global for the system
const state = observable.box(1);
const getState = () => String(state.get());

const timeState = observable.map<
  string,
  Record<string, MergableSerialized<AnyInstance>>
>();

function getTimeStateThread(identifier: string) {
  if (!timeState.has(identifier)) {
    runInAction(() => timeState.set(identifier, { [getState()]: {} } as any));
  }
  return timeState.get(identifier)!;
}

// Helpers for the shape of internal state
type AnyClass = (typeof allClasses)[number];
type AnyInstance = InstanceType<AnyClass>;

const source = observable.map<string, AnyInstance>();
const { root, subscribe } = createEmittingRoot({
  source,
  onRootSet: () => true,
  onSet: action((key: string, value: T) => {
    source.set(key, value);
  }),
});

/**
 *
 *
 *
 *
 *
 */

abstract class Base extends UniversalObject {
  constructor(public identifier: string = generateId()) {
    super(identifier);
    // register with root
    root[this.identifier] = (this as unknown) as AnyInstance;
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
    mainProject: Project,
  };

  static serialize(user: User) {
    const { name } = user;
    return {
      name,
      ...serializeMany(user, 'projects'),
      ...serializeOne(user, 'mainProject'),
    };
  }

  @observable
  name = '';

  @action
  setName(name: string) {
    this.name = name;
  }

  @observable
  mainProject?: Project;

  projects = observable.map<string, Project>();

  @action
  addProject(id: string = generateId(), name: string) {
    const project = new Project(id);
    project.setName(name);
    this.projects.set(project.identifier, project);
    return project;
  }

  @action
  selectProject(project?: Project) {
    this.mainProject = project;
  }
}

/**
 *
 *
 *
 *
 *
 */

const allClasses = [Project, User] as const;

const classFromType = allClasses.reduce(
  (lookup, Class) => {
    lookup[Class['@type']] = Class;
    return lookup;
  },
  {} as Record<string, AnyClass>
);

const timeStateHandler = () => {
  const disposersMap: Record<string, (() => void)[]> = {};
  const instancesMap = observable.map<string, AnyInstance>();

  return async (msg: RootEventMsg<AnyInstance>) => {
    const { key } = msg;

    let mutexLocked = false;
    const stateThread = getTimeStateThread(key);

    const storeSerialized = (
      serialized: Omit<Serialized<any>, 'identifier'>
    ) => {
      if (serialized == null || mutexLocked) return;
      try {
        mutexLocked = true;
        mergeSerialized(getState(), stateThread, serialized);
      } finally {
        mutexLocked = false;
      }
    };

    switch (msg.type) {
      case 'update':
        runInAction(() => {
          instancesMap.set(key, msg.value);
          // storeSerialized((msg.value.constructor as any).serialize(msg.value))
        });
      case 'observed': {
        if (disposersMap[key] == null) {
          disposersMap[key] = [];
          disposersMap[key].push(
            reaction(
              () =>
                valueAt(getState(), stateThread) as Partial<Serialized<any>>,
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
              storeSerialized,
              { fireImmediately: false }
            )
          );
        }
        break;
      }

      case 'unobserved':
        disposersMap[key].forEach(disposer => disposer());
        delete disposersMap[key];
        break;
      default:
        ensureNever(msg);
    }
  };
};

subscribe(timeStateHandler());

// const isEmail = (v: unknown) => typeof v === 'string' && v.indexOf('@') > -1;
// const classFactory = () => {
//   const knownObjects: Record<string, boolean> = {};
//   return async (msg: RootEventMsg<AnyInstance>) => {
//     switch (msg.type) {
//       case 'observed': {
//         const { key, set } = msg;
//         if (!knownObjects[key] && isEmail(key)) {
//           set(new User(key));
//         }
//         break;
//       }
//       case 'update': {
//         const { key, value } = msg;
//         if (value) knownObjects[key] = true;
//         break;
//       }
//       case 'unobserved': {
//         const { key } = msg;
//         delete knownObjects[key];
//         break;
//       }
//       default:
//         ensureNever(msg);
//     }
//   };
// };
// subscribe(classFactory());

describe('one class', () => {
  test.only('timeState boots', async () => {
    runInAction(() => new User('username'));

    const keepAlive = when(() => {
      const user = root['username'] as User;
      return user.name === 'done' || user.projects.size === 5;
    });

    const user = root['username'] as User;
    expect(user).toBeInstanceOf(User);

    user.setName('TEST');
    const project = user.addProject('dude', 'Dude');

    autorun(() => {
      console.log(root['dude'].name);
    })();
    project.setName('test2');

    console.log(JSON.stringify(toJS(timeState)));

    user.setName('done');
    await keepAlive;
    console.log('hello');
  });
  // type Message = RootEventMsg<AnyInstance>;
  // let root!: Record<string, AnyInstance>;
  // let subscribe!: (callback: (msg: Message) => void) => SubscriptionToken;
  // beforeEach(() => {
  //   state = observable.box(1);
  //   const rootBag = createEmittingRoot<AnyInstance>({
  //     onObserved: (key, set) =>
  //       runInAction(() => {
  //         const Class = lookupClassFromPath(key2path(key));
  //         const instance = new Class(key);
  //         set(instance);
  //       }),
  //   });
  //   root = rootBag.root;
  //   subscribe = rootBag.subscribe;
  // });
  // test('it allows external updates', async () => {
  //   subscribe(timeStateHandler());
  //   const username = 'test@example.com';
  //   const key = path2key([username]);
  //   const keepAlive = when(() => root[key].name === 'done');
  //   const user = root[key] as User;
  //   expect(user.name).toBe('');
  //   runInAction(() => state.set(2));
  //   user.setName('Two');
  //   expect(toJS(timeState)).toMatchSnapshot();
  //   // console.log(toJS(globalStore));
  //   runInAction(() => state.set(3));
  //   user.setName('Three');
  //   expect(toJS(timeState)).toMatchSnapshot();
  //   mergeSerialized('4', getTimeStateThread(key), { name: 'Four' });
  //   expect(user.name).toBe('Three');
  //   runInAction(() => state.set(4));
  //   expect(user.name).toBe('Four');
  //   setTimeout(() => root[key]!.setName('done'), 10);
  //   // expect(1).toBe(2)
  //   await keepAlive;
  //   console.log('done');
  // });
  // test('it supports one to many', async () => {
  //   subscribe(timeStateHandler());
  //   const username = 'existing@example.com';
  //   const key = path2key([username]);
  //   const keepAlive = when(() => root[key].name === 'done');
  //   const user = root[key] as User;
  //   expect(user.name).toBe('Existing');
  //   runInAction(() => state.set(2));
  //   user.addProject('p1', 'Two');
  //   expect(toJS(timeState)).toMatchSnapshot();
  //   runInAction(() => state.set(3));
  //   user.projects
  //     .values()
  //     .next()
  //     .value.setName('Three');
  //   expect(toJS(timeState)).toMatchSnapshot();
  //   setTimeout(() => root[key]!.setName('done'), 10);
  //   // expect(1).toBe(2)
  //   await keepAlive;
  //   console.log('done');
  // });
  // test('it supports zero or one', async () => {
  //   subscribe(timeStateHandler());
  //   const username = 'existing@example.com';
  //   const key = path2key([username]);
  //   const keepAlive = when(() => root[key].name === 'done');
  //   const user = root[key] as User;
  //   expect(user.name).toBe('Existing');
  //   runInAction(() => state.set(2));
  //   const project = user.addProject('p1', 'Two');
  //   expect(toJS(timeState)).toMatchSnapshot();
  //   runInAction(() => state.set(3));
  //   user.projects
  //     .values()
  //     .next()
  //     .value.setName('Three');
  //   user.selectProject(project);
  //   expect(toJS(timeState)).toMatchSnapshot();
  //   setTimeout(() => root[key]!.setName('done'), 10);
  //   // expect(1).toBe(2)
  //   await keepAlive;
  //   console.log('done');
  // });
});
