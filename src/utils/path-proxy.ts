import {
  observable,
  onBecomeObserved,
  runInAction,
  onBecomeUnobserved,
  getAtom,
} from 'mobx';
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

export const m = <T>(v: Maybe<T>): T | undefined =>
  // @ts-ignore
  v === nothing ? undefined : v;

type NodeBehaviour = {
  initialValue: SPOShape;
  onActive?: () => void;
  onInactive?: () => void;
};

export const createUniverse = <T extends SPOShape>(
  resolve: (path: string[]) => Promise<NodeBehaviour>
): ThunkTo<T> => {
  const core = observable<SPOShape>({});

  const createPathProxy = (path: string[] = []): ThunkTo<T> => {
    const proxy = new Proxy(
      () => {
        const key = JSON.stringify(path);

        if (core[key] == null) {
          core[key] = nothing;

          const disposer = onBecomeObserved(core, key, async () => {
            disposer();
            const { initialValue, onActive, onInactive } = await resolve(path);

            // set the value
            runInAction(() => (core[key] = initialValue));

            // attach listeners
            if (onActive) {
              onBecomeObserved(core, key, onActive);
              // run listener immediately if it's already observed
              const atom = getAtom(core, key);
              if (
                atom.observing &&
                atom.observing.find(observable => observable.isBeingObserved)
              ) {
                onActive();
              }
            }
            if (onInactive) {
              onBecomeUnobserved(core, key, onInactive);
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
