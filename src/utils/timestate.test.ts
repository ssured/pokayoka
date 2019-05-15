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
  IComputedValue,
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
import { observe } from 'fast-json-patch';
import { isObject } from 'util';
import { catchClause } from '@babel/types';

configure({ enforceActions: 'always', disableErrorBoundaries: true });

describe('simple example', () => {
  test.skip('minimal', async () => {
    const { getState, setState } = (() => {
      const state = observable.box('1');
      return {
        getState: () => state.get(),
        setState: action((s: string) => state.set(s)),
      };
    })();

    type Context = {
      $: Record<string, any>;
      getCurrent: IComputedValue<any>;
    };
    class Base {
      get '@type'() {
        return (this.constructor as any)['@type'];
      }

      constructor(
        type: string,
        public identifier: string,
        protected context: Context
      ) {
        if (type !== (this as any)['@type']) {
          throw new Error('Not the correct type');
        }

        const disposer = autorun(() => {
          const newValue = this.context.getCurrent.get();
          if (isObject(newValue)) {
            const { ['@type']: type, identifier, ...rest } = newValue;
            runInAction(() => Object.assign(this, rest));
          }
        });
      }
    }
    class User extends Base {
      static '@type' = 'user' as const;

      @observable
      name = '';

      @action
      setName(name: string) {
        this.name = name;
      }

      @observable
      projectRef: string[] | null = null;

      @computed({ name: 'user:project' })
      get project(): Project | null {
        return this.projectRef && this.context.$[this.projectRef[0]];
      }

      @computed({ equals: comparer.structural, name: 'user:serialized' })
      get serialized() {
        return {
          name: this.name,
          projectRef: this.projectRef,
        };
      }
    }

    class Project extends Base {
      static '@type' = 'project' as const;

      @observable
      name = '';

      @computed({ equals: comparer.structural, name: 'project:serialized' })
      get serialized() {
        return {
          name: this.name,
        };
      }
    }

    const allClasses = [User, Project];
    const classFromType = allClasses.reduce(
      (lookup, Class) => {
        lookup[Class['@type']] = Class;
        return lookup;
      },
      {} as Record<string, AnyClass>
    );

    type AnyClass = (typeof allClasses)[number];
    type AnyInstance = InstanceType<AnyClass>;
    type Shape = AnyInstance;

    const everything = observable.map<
      string,
      Record<string, ToMergeableObject<Shape>>
    >();

    const timeState = action((key: string) => {
      if (!everything.has(key)) {
        everything.set(
          key,
          observable.object<Record<string, ToMergeableObject<Shape>>>({})
        );
      }
      return everything.get(key)!;
    });

    const trackStateOf = <T extends Shape = Shape>(
      identifier: string
    ): IComputedValue<T | null> => {
      const ts = timeState(identifier);
      const box = computed(() => valueAt(getState(), ts), {
        name: `trackStateOf-${identifier}`,

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
      return box as any;
    };

    const { root: $, subscribe } = createEmittingRoot<Shape>({
      create: action(
        (key: string): Shape => {
          const [type, identifier] = key.split('-');
          const Class = classFromType[type];
          if (Class == null) {
            throw new Error(`No constructor for ${key}`);
          }
          const result = new Class(type, identifier, {
            $,
            getCurrent: trackStateOf(key),
          });

          return result;
        }
      ),
      onObserved: (key, set) => {
        console.log(key);
      },
      onUnobserved: key => {
        console.log(key);
      },
      onSet: (key, value) => {
        console.log(key);
      },
    });

    let user!: User;

    live(async done => {
      user = $['user-sjoerd'] as User;
      console.log(user.name);
      if (user.name === 'sjoerd') done();
    });

    user.setName('one');

    const currentShape = trackStateOf('user-sjoerd');

    // setState('2');
    currentShape.set({ name: 'two' });

    // const names: string[] = [];

    // const disposer = autorun(() => {
    //   const current = currentShape.get();
    //   if (current) {
    //     names.push(current.name);
    //   }
    // });

    // currentShape.set({ name: 'one' });

    // expect(names).toEqual(['one']);
    // setState('2');
    // expect(names).toEqual(['one']);

    // currentShape.set({ name: 'two' });

    // expect(names).toEqual(['one', 'two']);

    // setState('3');

    // currentShape.set({ name: 'three' });

    // expect(names).toEqual(['one', 'two', 'three']);

    // setState('4');

    // currentShape.set(null);

    // expect(names).toEqual(['one', 'two', 'three']);

    // setState('5');

    // currentShape.set({ name: 'five' });

    // expect(names).toEqual(['one', 'two', 'three', 'five']);

    // disposer();

    expect(toJS(everything)).toMatchSnapshot();
  });
});

// // state is global for the system
// const state = observable.box(1);
// const getState = () => String(state.get());
// const setState = action((n: number) => state.set(n));

// const timeState = observable.map<
//   string,
//   Record<string, MergableSerialized<AnyInstance>>
// >();

// function getTimeStateThread(identifier: string) {
//   if (!timeState.has(identifier)) {
//     runInAction(() => timeState.set(identifier, { [getState()]: {} } as any));
//   }
//   return timeState.get(identifier)!;
// }

// // Helpers for the shape of internal state
// type AnyClass = (typeof allClasses)[number];
// type AnyInstance = InstanceType<AnyClass>;

// const source = observable.map<string, AnyInstance>();
// const { root, subscribe } = createEmittingRoot({
//   source,
//   create: key => new User(key, root),
//   onRootSet: () => true,
//   onSet: action((key: string, value: AnyInstance) => {
//     source.set(key, value);
//   }),
// });

// /**
//  *
//  *
//  *
//  *
//  *
//  */

// abstract class Base extends UniversalObject {
//   constructor(
//     public identifier: string = generateId(),
//     private root: Record<string, any>
//   ) {
//     super(identifier);
//     // register with root
//     runInAction(
//       () => (root[this.identifier] = (this as unknown) as AnyInstance)
//     );
//   }
// }

// class Project extends Base {
//   static '@type' = 'Project';

//   static serialize({ name }: Project) {
//     return { name };
//   }

//   @observable
//   name = '';

//   @action
//   setName(name: string) {
//     this.name = name;
//   }
// }

// class User extends Base {
//   static '@type' = 'User';

//   static constructors = {
//     projects: many(Project),
//     mainProject: Project,
//   };

//   static serialize(user: User) {
//     const { name } = user;
//     return {
//       name,
//       ...serializeMany(user, 'projects'),
//       ...serializeOne(user, 'mainProject'),
//     };
//   }

//   @observable
//   name = '';

//   @action
//   setName(name: string) {
//     this.name = name;
//   }

//   @observable
//   mainProject?: Project;

//   projects = observable.map<string, Project>();

//   @action
//   addProject(id: string = generateId(), name: string) {
//     const project = new Project(id);
//     project.setName(name);
//     this.projects.set(project.identifier, project);
//     return project;
//   }

//   @action
//   selectProject(project?: Project) {
//     this.mainProject = project;
//   }
// }

// /**
//  *
//  *
//  *
//  *
//  *
//  */

// const allClasses = [Project, User] as const;

// const classFromType = allClasses.reduce(
//   (lookup, Class) => {
//     lookup[Class['@type']] = Class;
//     return lookup;
//   },
//   {} as Record<string, AnyClass>
// );

// const isEmpty = (v: unknown): boolean => {
//   switch (typeof v) {
//     case 'object':
//       return (
//         v == null || (Array.isArray(v) ? v.length : Object.keys(v).length) === 0
//       );
//     case 'string':
//       return v === '';
//   }
//   return false;
// };

// const timeStateHandler = () => {
//   const observedDisposers: Record<string, () => void> = {};

//   const instancesMap = observable.map<string, AnyInstance>();

//   const instancesDisposers: Record<string, () => void> = {};
//   instancesMap.observe(change => {
//     const instance = change.type === 'delete' ? null : change.newValue;
//     const key = change.name;

//     if (instancesDisposers[key]) {
//       instancesDisposers[key]();
//     }
//     if (instance) {
//       instancesDisposers[key] = reaction(
//         () => (instance.constructor as any).serialize(instance),
//         serialized => {
//           if (isEmpty(serialized)) {
//             return;
//           }
//           mergeSerialized(getState(), getTimeStateThread(key), serialized);
//         },
//         { fireImmediately: true }
//       );
//     }
//   });

//   return async (msg: RootEventMsg<AnyInstance>) => {
//     const { key } = msg;
//     const stateThread = getTimeStateThread(key);

//     const getSerializedFromTimeState = () => {
//       const instance = instancesMap.get(key);
//       if (instance == null) {
//         return;
//       }
//       const current = valueAt(getState(), stateThread) as Partial<
//         Serialized<any>
//       >;
//       return isEmpty(current) ? undefined : current;
//     };

//     const mergeSerializedIntoInstance = (serialized: any) => {
//       const instance = instancesMap.get(key);
//       if (instance == null) {
//         return;
//       }
//       (instance.constructor as any).merge(instance, serialized);
//     };

//     switch (msg.type) {
//       case 'update':
//         runInAction(() => {
//           instancesMap.set(key, msg.value);
//         });
//         break;
//       case 'observed': {
//         observedDisposers[key] = reaction(
//           getSerializedFromTimeState,
//           mergeSerializedIntoInstance,
//           {
//             fireImmediately: true,
//           }
//         );
//         break;
//       }
//       case 'unobserved':
//         observedDisposers[key]();
//         delete observedDisposers[key];
//         break;
//       default:
//         ensureNever(msg);
//     }
//   };
// };

// subscribe(timeStateHandler());

// describe('one class', () => {
//   test('timeState boots', async () => {
//     runInAction(() => new User('username'));

//     const keepObserved = when(() => {
//       const user = root['username'] as User;
//       return user.name === 'done';
//     });

//     const user = root['username'] as User;
//     expect(user).toBeInstanceOf(User);

//     user.setName('TEST');

//     const project = user.addProject('dude', 'Dude');

//     setState(2);

//     user.selectProject(project);

//     // console.log(JSON.stringify(toJS(timeState)));
//     expect(toJS(timeState)).toEqual({
//       username: {
//         '1': {
//           name: { '1': 'TEST' },
//           mainProject: { '1': null, '2': ['dude'] },
//           projects: { '1': { dude: { '1': ['dude'] } } },
//         },
//       },
//       dude: { '1': { name: { '1': 'Dude' } } },
//     });

//     user.setName('done');
//     await keepObserved;
//     console.log('hello');
//   });

//   test('timeState reads', async () => {
//     runInAction(() =>
//       timeState.merge({
//         username: {
//           '1': {
//             name: { '1': 'TEST' },
//             mainProject: { '1': null, '2': ['dude'] },
//             projects: { '1': { dude: { '1': ['dude'] } } },
//           },
//         },
//         dude: { '1': { name: { '1': 'Dude' } } },
//       })
//     );

//     const keepObserved = when(() => {
//       const user = root['username'] as User;
//       return user.name === 'done';
//     });

//     const user = root['username'] as User;
//     expect(user).toBeInstanceOf(User);

//     expect(getState()).toBe('1');
//     expect(user.projects.size).toBe(1);

//     // user.setName('TEST');

//     // const project = user.addProject('dude', 'Dude');

//     // setState(2);

//     // user.selectProject(project);

//     // console.log(JSON.stringify(toJS(timeState)));
//     expect(toJS(timeState)).toEqual({
//       username: {
//         '1': {
//           name: { '1': 'TEST' },
//           mainProject: { '1': null, '2': ['dude'] },
//           projects: { '1': { dude: { '1': ['dude'] } } },
//         },
//       },
//       dude: { '1': { name: { '1': 'Dude' } } },
//     });

//     user.setName('done');
//     await keepObserved;
//     console.log('hello');
//   });
// });
