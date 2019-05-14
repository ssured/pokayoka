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
  computed,
  comparer,
} from 'mobx';
import { generateId } from './id';
import { ensureNever, isEqual } from './index';
import {
  valueAt,
  ToMergeableObject,
  merge,
  pickAt,
  asMergeableObject,
} from './object-crdt';
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
import { live } from './mobx';

configure({ enforceActions: 'observed', disableErrorBoundaries: true });

describe('simple example', () => {
  test.only('minimal', () => {
    const { getState, setState } = (() => {
      const state = observable.box('1');
      return {
        getState: () => state.get(),
        setState: action((s: string) => state.set(s)),
      };
    })();

    type Shape = { name: string };

    const timeState = (() => {
      const all = observable.map<
        string,
        Record<string, ToMergeableObject<Shape>>
      >();

      return (key: string = '') => {
        if (key == '') {
          return toJS(all);
        }
        if (!all.has(key)) {
          all.set(
            key,
            observable.object<Record<string, ToMergeableObject<Shape>>>({})
          );
        }
        return all.get(key)!;
      };
    })();

    const names: string[] = [];

    const getCurrent = (identifier: string) => {
      const ts = timeState(identifier);
      const box = computed(() => valueAt(getState(), ts), {
        set: (newValue: Shape | null) => {
          const current = box.get();
          const currentSource = pickAt(getState(), ts)!;

          if (newValue) {
            if (current == null) {
              merge(ts as any, asMergeableObject(getState(), newValue) as any);
            } else {
              for (const [key, value] of Object.entries(newValue)) {
                if (!isEqual((current as any)[key], value)) {
                  merge(currentSource, {
                    [key]: { [getState()]: value as any },
                  } as any);
                }
              }
            }
          } else {
            merge(ts as any, asMergeableObject(getState(), null as any) as any);
          }
        },
        equals: comparer.structural,
      });
      return box;
    };

    const getShape = getCurrent('shape');

    const disposer = autorun(() => {
      const current = getShape.get();
      if (current) {
        names.push(current.name);
      }
    });
    getShape.set({ name: 'one' });

    expect(names).toEqual(['one']);
    setState('2');
    expect(names).toEqual(['one']);

    getShape.set({ name: 'two' });

    expect(names).toEqual(['one', 'two']);

    setState('3');

    getShape.set({ name: 'three' });

    expect(names).toEqual(['one', 'two', 'three']);

    setState('4');

    getShape.set(null);

    expect(names).toEqual(['one', 'two', 'three']);

    setState('5');

    getShape.set({ name: 'five' });

    expect(names).toEqual(['one', 'two', 'three', 'five']);

    disposer();

    expect(timeState()).toMatchSnapshot();
  });
});

// state is global for the system
const state = observable.box(1);
const getState = () => String(state.get());
const setState = action((n: number) => state.set(n));

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
  create: key => new User(key, root),
  onRootSet: () => true,
  onSet: action((key: string, value: AnyInstance) => {
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
  constructor(
    public identifier: string = generateId(),
    private root: Record<string, any>
  ) {
    super(identifier);
    // register with root
    runInAction(
      () => (root[this.identifier] = (this as unknown) as AnyInstance)
    );
  }
}

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

const isEmpty = (v: unknown): boolean => {
  switch (typeof v) {
    case 'object':
      return (
        v == null || (Array.isArray(v) ? v.length : Object.keys(v).length) === 0
      );
    case 'string':
      return v === '';
  }
  return false;
};

const timeStateHandler = () => {
  const observedDisposers: Record<string, () => void> = {};

  const instancesMap = observable.map<string, AnyInstance>();

  const instancesDisposers: Record<string, () => void> = {};
  instancesMap.observe(change => {
    const instance = change.type === 'delete' ? null : change.newValue;
    const key = change.name;

    if (instancesDisposers[key]) {
      instancesDisposers[key]();
    }
    if (instance) {
      instancesDisposers[key] = reaction(
        () => (instance.constructor as any).serialize(instance),
        serialized => {
          if (isEmpty(serialized)) {
            return;
          }
          mergeSerialized(getState(), getTimeStateThread(key), serialized);
        },
        { fireImmediately: true }
      );
    }
  });

  return async (msg: RootEventMsg<AnyInstance>) => {
    const { key } = msg;
    const stateThread = getTimeStateThread(key);

    const getSerializedFromTimeState = () => {
      const instance = instancesMap.get(key);
      if (instance == null) {
        return;
      }
      const current = valueAt(getState(), stateThread) as Partial<
        Serialized<any>
      >;
      return isEmpty(current) ? undefined : current;
    };

    const mergeSerializedIntoInstance = (serialized: any) => {
      const instance = instancesMap.get(key);
      if (instance == null) {
        return;
      }
      (instance.constructor as any).merge(instance, serialized);
    };

    switch (msg.type) {
      case 'update':
        runInAction(() => {
          instancesMap.set(key, msg.value);
        });
        break;
      case 'observed': {
        observedDisposers[key] = reaction(
          getSerializedFromTimeState,
          mergeSerializedIntoInstance,
          {
            fireImmediately: true,
          }
        );
        break;
      }
      case 'unobserved':
        observedDisposers[key]();
        delete observedDisposers[key];
        break;
      default:
        ensureNever(msg);
    }
  };
};

subscribe(timeStateHandler());

describe('one class', () => {
  test('timeState boots', async () => {
    runInAction(() => new User('username'));

    const keepObserved = when(() => {
      const user = root['username'] as User;
      return user.name === 'done';
    });

    const user = root['username'] as User;
    expect(user).toBeInstanceOf(User);

    user.setName('TEST');

    const project = user.addProject('dude', 'Dude');

    setState(2);

    user.selectProject(project);

    // console.log(JSON.stringify(toJS(timeState)));
    expect(toJS(timeState)).toEqual({
      username: {
        '1': {
          name: { '1': 'TEST' },
          mainProject: { '1': null, '2': ['dude'] },
          projects: { '1': { dude: { '1': ['dude'] } } },
        },
      },
      dude: { '1': { name: { '1': 'Dude' } } },
    });

    user.setName('done');
    await keepObserved;
    console.log('hello');
  });

  test('timeState reads', async () => {
    runInAction(() =>
      timeState.merge({
        username: {
          '1': {
            name: { '1': 'TEST' },
            mainProject: { '1': null, '2': ['dude'] },
            projects: { '1': { dude: { '1': ['dude'] } } },
          },
        },
        dude: { '1': { name: { '1': 'Dude' } } },
      })
    );

    const keepObserved = when(() => {
      const user = root['username'] as User;
      return user.name === 'done';
    });

    const user = root['username'] as User;
    expect(user).toBeInstanceOf(User);

    expect(getState()).toBe('1');
    expect(user.projects.size).toBe(1);

    // user.setName('TEST');

    // const project = user.addProject('dude', 'Dude');

    // setState(2);

    // user.selectProject(project);

    // console.log(JSON.stringify(toJS(timeState)));
    expect(toJS(timeState)).toEqual({
      username: {
        '1': {
          name: { '1': 'TEST' },
          mainProject: { '1': null, '2': ['dude'] },
          projects: { '1': { dude: { '1': ['dude'] } } },
        },
      },
      dude: { '1': { name: { '1': 'Dude' } } },
    });

    user.setName('done');
    await keepObserved;
    console.log('hello');
  });
});
