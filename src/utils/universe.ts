import {
  observable,
  onBecomeObserved,
  runInAction,
  onBecomeUnobserved,
} from 'mobx';
import { SPOShape, primitive, RawSPOShape } from './spo';
import dlv from 'dlv';
import { RelationsOf, Many } from '../model/base';

export type Nothing = { [key: string]: Nothing };

export type Maybe<T> = T extends SPOShape
  ? Required<T> extends Many<infer U>
    ? { [K in string]: Maybe<U> }
    : { [K in keyof Required<T>]: Maybe<Required<T>[K]> } | Nothing
  : T | undefined;

export type ThunkTo<T extends SPOShape> = {
  (): { [K in keyof T]: Maybe<T[K]> };
} & {
  [K in keyof T]: T[K] extends primitive
    ? T[K]
    : Required<T>[K] extends SPOShape
    ? ThunkTo<Required<T>[K]>
    : never
};

type NodeBehaviour = {
  onActive?: () => void;
  onInactive?: () => void;
};

const proxyPathSymbol = Symbol('path of proxy');
export const getPath = (obj: any): string[] | undefined => {
  // @ts-ignore
  return (obj && typeof obj === 'object' && obj[proxyPathSymbol]) || undefined;
};

const setPath = (obj: any, path: string[]): void => {
  if (obj && typeof obj === 'object') {
    obj[proxyPathSymbol] = path;
    if (!Array.isArray(obj)) {
      // TODO recurse deeper and set all paths for linked objects?
      // for some reason this breaks current tests
      // needs more investigation
    }
  }
};

const proxyKeysSymbol = Symbol('keys of proxy');
const getKeys = (obj: any): Set<string> | undefined => {
  // @ts-ignore
  return (obj && typeof obj === 'object' && obj[proxyKeysSymbol]) || undefined;
};

// @ts-ignore
export const isSomething = <T>(v: Maybe<Nothing | T>): v is T => {
  const keys = getKeys(v);
  return (keys && keys.size > 0) || false;
};

let storageErrors = 0;

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
    const keys = observable.set<string>([], { deep: false });
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

      // setTimeout(
      //   () =>
      //     runInAction(() => {
      try {
        core[key] = proxy;
      } catch (e) {
        storageErrors += 1;
        if (storageErrors > 10) {
          console.error(
            'FIXME could not store key and the problem got out of hand',
            key
          );

          /**
           * Some computed + observed side effect problem with mobx happens here.
           * this solution seems hacky but works wonders
           * This only occurs when referencing another node in the tree
           * so it might be related with a cyclic dependency
           *
           * just returning the proxy is a pretty ok solution
           */
        }

        return proxy;
      }

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
      //     }),
      //   0
      // );

      return proxy;
    }

    return core[key] as any;
  };

  function publicSet(
    path: string[],
    emitValues: boolean,
    value: RawSPOShape[string]
  ) {
    runInAction(() => {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !getPath(value)
      ) {
        if (emitValues) {
          // console.log('publicSet emits', path, value);
          updateListener(path, value);
        }

        // ensure the whole path is set by settings all keys of the subpath
        for (const [i, part] of path.entries()) {
          getKeys(publicGet(path.slice(0, i)))!.add(part);
        }

        setPath(value, path);

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
              const valuePath = getPath(value);
              if (valuePath) {
                core[subKey] = publicGet(valuePath);
              } else {
                publicSet(subPath, emitValues, value);
              }
            }
          } else {
            if (value == null && subKey in core) {
              // cascade deleting down the tree
              const current = core[subKey];
              if (
                current &&
                typeof current === 'object' &&
                !Array.isArray(current) // do not follow links
              ) {
                const currentKeys = Object.keys(current);
                if (currentKeys.length > 0) {
                  publicSet(
                    subPath,
                    emitValues,
                    currentKeys.reduce(
                      (nullMap, key) => {
                        nullMap[key] = null;
                        return nullMap;
                      },
                      {} as any
                    )
                  );
                }
              }
              delete core[subKey];
            } else {
              core[subKey] = value;
            }
          }
        });
      } else {
        if (path.length > 0) {
          publicSet(path.slice(0, -1), emitValues, {
            [path[path.length - 1]]: value,
          });
        }
      }
    });
  }

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
