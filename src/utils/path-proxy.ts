import { observable, onBecomeObserved, runInAction } from 'mobx';
import { SPOShape, primitive } from './spo';
import { nothing, Nothing } from './maybe';

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

const core = observable<SPOShape>({});

export const m = <T>(v: Maybe<T>): T | undefined =>
  // @ts-ignore
  v === nothing ? undefined : v;

export const createUniverse = <T extends SPOShape>(
  resolve: (path: string[]) => Promise<SPOShape>
): ThunkTo<T> => {
  const createPathProxy = (path: string[] = []): ThunkTo<T> => {
    const proxy = new Proxy(
      () => {
        const key = JSON.stringify(path);

        if (core[key] == null) {
          core[key] = nothing;

          let isResolving = false;
          const disposer = onBecomeObserved(core, key, async () => {
            if (isResolving) return;
            try {
              isResolving = true;
              const value = await resolve(path);
              runInAction(() => (core[key] = value));
              disposer();
            } finally {
              isResolving = false;
            }
          });
        }

        // return getter for mobx observability
        return new Proxy(
          {},
          {
            get(source, subkey) {
              // @ts-ignore
              return core[key][subkey] || nothing;
            },
          }
        );
      },
      {
        get(source, key) {
          if (typeof key !== 'string') return undefined;
          return createPathProxy(path.concat(key));
        },
      }
    );
    return proxy as any;
  };

  return createPathProxy();
};
