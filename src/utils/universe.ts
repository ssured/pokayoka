import {
  observable,
  onBecomeObserved,
  runInAction,
  onBecomeUnobserved,
} from 'mobx';
import { SPOShape, primitive, RawSPOShape } from './spo';
import { nothing, Nothing } from './maybe';
import dlv from 'dlv';
import { RelationsOf } from '../model/base';

export type Maybe<T> = T extends object
  ? { [K in keyof T]: Maybe<T[K]> }
  : T | Nothing;

export type ThunkTo<T extends SPOShape> = {
  (): { [K in keyof T]: Maybe<T[K]> };
} & {
  [K in keyof T]: T[K] extends primitive
    ? T[K]
    : Required<T>[K] extends SPOShape
    ? /*Required<T>[K] extends Many<infer U>
      ? {
          (): Maybe<Many<ThunkTo<U>>>;
        } & Many<ThunkTo<U>>
      : */ ThunkTo<
        Required<T>[K]
      >
    : never
};

export function ifExists<T>(maybe: Maybe<T>): T | undefined;
export function ifExists<T, U>(maybe: Maybe<T>, otherwise?: U): T | U {
  // @ts-ignore
  return maybe === nothing ? otherwise : maybe;
}

export const deepM = <T>(v: Maybe<T>): T | undefined =>
  // @ts-ignore
  v === nothing
    ? undefined
    : v && typeof v === 'object' && !Array.isArray(v)
    ? Object.entries(v).reduce(
        (v, [key, value]) => {
          const sure = deepM(value);
          if (sure !== undefined) {
            const obj = v || {};
            obj[key] = sure;
            return obj;
          }
          return v;
        },
        undefined as Record<string, any> | undefined
      )
    : v;

type NodeBehaviour = {
  onActive?: () => void;
  onInactive?: () => void;
};

const proxyPathSymbol = Symbol('path of proxy');
export const getPath = (obj: SPOShape): string[] | undefined => {
  // @ts-ignore
  return obj[proxyPathSymbol];
};

const proxyKeysSymbol = Symbol('keys of proxy');
export const getKeys = (obj: SPOShape): Set<string> | undefined => {
  // @ts-ignore
  return obj[proxyKeysSymbol];
};

export const createUniverse = <T extends SPOShape>({
  runtimeShape,
  resolve,
  updateListener,
  pathToKey = JSON.stringify,
}: {
  runtimeShape: RelationsOf<T>;
  resolve: (path: string[]) => void | NodeBehaviour;
  updateListener: (path: string[], value: RawSPOShape) => void;
  pathToKey?: (path: string[]) => string;
}): {
  root: ThunkTo<T>;
  get: (path: string[]) => Maybe<SPOShape>;
  set: (
    path: string[],
    emitValues: boolean,
    value: RawSPOShape[string]
  ) => void;
} => {
  const core = observable<SPOShape>({}, {}, { deep: false });

  const publicGet = (path: string[]): Maybe<SPOShape> => {
    const keys = new Set<string>();
    const key = pathToKey(path);

    if (!core[key]) {
      const proxy: SPOShape = new Proxy({} as any, {
        get(_, subkey) {
          if (typeof subkey === 'string') {
            // access core[key] to trigger mobx observable tracking
            core[key]; // this is not a no-op!

            const subPath = path.concat(subkey);

            // test if we expect a subject or a value at the path
            return !!dlv(runtimeShape, subPath)
              ? publicGet(subPath)
              : core[pathToKey(subPath)];
          }
          switch (subkey) {
            case proxyPathSymbol:
              return path;
            case proxyKeysSymbol:
              return keys;
          }
        },
        set(_, subkey, value) {
          if (typeof subkey === 'string') {
            // console.log('publicSet', path.concat(subkey), true, value);
            publicSet(path.concat(subkey), true, value);
            return true;
          }
          return false;
        },
        ownKeys() {
          core[key]; // this is not a no-op!
          return [...keys];
        },
        has(_, key) {
          if (typeof key === 'string') {
            core[key]; // this is not a no-op!
            return keys.has(key);
          }
          return false;
        },
        getOwnPropertyDescriptor(_, key) {
          if (typeof key === 'string') {
            core[key]; // this is not a no-op!
            return {
              configurable: true,
              enumerable: true,
            };
          }
        },
      });

      core[key] = proxy;

      const unregister = onBecomeObserved(core, key, () => {
        unregister();

        const { onActive, onInactive } = resolve(path) || ({} as NodeBehaviour);

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

  const publicSet = (
    path: string[],
    emitValues: boolean,
    value: RawSPOShape[string]
  ) => {
    runInAction(() => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (emitValues) {
          // console.log('publicSet emits', path, value);
          updateListener(path, value);
        }

        // ensure the whole path is set by settings all keys of the subpath
        for (const [i, part] of path.entries()) {
          getKeys(publicGet(path.slice(0, i)))!.add(part);
        }

        const keys = getKeys(publicGet(path))!;

        Object.entries(value).forEach(([key, value]) => {
          // keep administration of all keys
          if (value == null) {
            keys.delete(key);
          } else {
            keys.add(key);
          }

          const subPath = path.concat(key);
          const subKey = pathToKey(subPath);

          if (value && typeof value === 'object') {
            if (Array.isArray(value)) {
              core[subKey] = publicGet(value);
            } else {
              if (getPath(value as SPOShape)) {
                core[subKey] = publicGet(getPath(value as SPOShape)!);
              } else {
                publicSet(subPath, emitValues, value);
              }
            }
          } else {
            if (value == null) {
              delete core[subKey];
            } else {
              core[subKey] = value;
            }
          }
        });
      } else {
        if (path.length >= 2) {
          publicSet(path.slice(0, -1), emitValues, {
            [path[path.length - 1]]: value,
          });
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

  return { root: createPathProxy(), set: publicSet, get: publicGet };
};
