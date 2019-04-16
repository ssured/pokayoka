import {
  observable,
  onBecomeObserved,
  runInAction,
  onBecomeUnobserved,
} from 'mobx';
import { SPOShape, primitive, RawSPOShape } from './spo';
import { nothing, Nothing } from './maybe';
import console = require('console');

type Maybe<T> = T extends object
  ? { [K in keyof T]: Maybe<T[K]> }
  : T | Nothing;

type ThunkTo<T extends SPOShape> = { (): { [K in keyof T]: Maybe<T[K]> } } & {
  [K in keyof T]: T[K] extends primitive
    ? T[K]
    : Required<T>[K] extends SPOShape
    ? ThunkTo<Required<T>[K]>
    : never
};

export const m = <T>(v: Maybe<T>): T | undefined =>
  // @ts-ignore
  v === nothing ? undefined : v;

type NodeBehaviour = {
  onActive?: () => void;
  onInactive?: () => void;
};

export const createUniverse = <T extends SPOShape>({
  resolve,
  pathToKey = JSON.stringify,
}: {
  resolve: (
    path: string[],
    setValue: (value: RawSPOShape) => void
  ) => void | NodeBehaviour;
  pathToKey?: (path: string[]) => string;
}): ThunkTo<T> => {
  const core = observable<SPOShape>({}, {}, { deep: false });

  const publicGet = (path: string[]): Maybe<SPOShape> => {
    const key = pathToKey(path);

    if (!core[key]) {
      core[key] = new Proxy(
        {},
        {
          get(source, subkey) {
            if (typeof subkey === 'string') {
              // access core[key] to trigger mobx observable tracking
              core[key]; // this is not a no-op!
              return core[pathToKey(path.concat(subkey))] || nothing;
            }
          },
          set(source, subkey, value) {
            if (typeof subkey === 'string') {
              publicSet(path.concat(subkey), value);
              return true;
            }
            return false;
          },
        }
      );

      const unregister = onBecomeObserved(core, key, () => {
        unregister();

        const { onActive, onInactive } =
          resolve(path, publicSet.bind(null, path)) || ({} as NodeBehaviour);

        // attach listeners
        if (onActive) {
          onBecomeObserved(core, key, onActive);
          onActive();
        }
        if (onInactive) {
          onBecomeUnobserved(core, key, onInactive);
        }
      });
    }

    return core[key] as any;
  };

  const publicSet = (path: string[], value: RawSPOShape[string]) => {
    runInAction(() => {
      if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, value]) => {
          if (value && typeof value === 'object') {
            if (Array.isArray(value)) {
              core[pathToKey(path.concat(key))] = publicGet(value);
            } else {
              publicSet(path.concat(key), value);
              publicGet(path.concat(key)); // make sure the object is linked
            }
          } else {
            if (value == null) {
              delete core[pathToKey(path.concat(key))];
            } else {
              core[pathToKey(path.concat(key))] = value;
            }
          }
        });
      } else {
        if (path.length >= 2) {
          publicSet(path.slice(0, -1), { [path[path.length - 1]]: value });
        }
      }
    });
  };

  const createPathProxy = (path: string[] = []): ThunkTo<T> => {
    const proxy = new Proxy(
      () => {
        return publicGet(path);
      },
      {
        get(source, key) {
          if (typeof key === 'string') {
            return createPathProxy(path.concat(key));
          }
        },
      }
    );
    return proxy as any;
  };

  return createPathProxy();
};
