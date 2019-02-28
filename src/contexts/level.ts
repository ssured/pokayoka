import { createContext, useContext, useEffect, useState, useRef } from 'react';
import levelUp from 'levelup';
import encode from 'encoding-down';
import levelJs from 'level-js';
import charwise, { CharwiseKey } from 'charwise';

import { Partition } from '../utils/level';
import {
  destroy,
  // resolveIdentifier,
  getEnv,
  IType,
  IAnyModelType,
  SnapshotIn,
} from 'mobx-state-tree';
import pull, { drain, Source, once } from 'pull-stream';
import createAbortable from 'pull-abortable';

import debug from 'debug';
import base, { filename } from 'paths.macro';
import { observable, runInAction } from 'mobx';
const log = debug(`${base}${filename}`);

const dbName = 'pokayoka';

const db = levelUp(
  encode(levelJs(dbName), {
    keyEncoding: charwise,
    valueEncoding: 'json',
  })
);

export const rootPartition = Partition.root(db);

export const LevelContext = createContext<Partition>(rootPartition);

export const useLevel = () => useContext(LevelContext);

type AnyTuple = [any] | [any, any] | [any, any, any];
export const useSource = function<T extends AnyTuple, U>(
  inputs: T,
  createSource: (...args: T) => Source<U>,
  onData: (data: U) => void
) {
  useEffect(() => {
    const abortable = createAbortable();
    pull(
      // @ts-ignore
      createSource(...inputs),
      abortable,
      drain(onData)
    );
    return abortable.abort;
  }, inputs);
};

const merge = <T extends IAnyModelType>(
  instance: T,
  snapshot: SnapshotIn<T>
) => {
  (instance as any).merge(snapshot);
};

export const useModel = <C, S, T>(
  Model: () => IType<C, S, T>,
  key: CharwiseKey
) => {
  const level = useLevel();
  const [instance, setInstance] = useState<null | T>(null);

  const cache = useRef(observable.map<string, T>({}, { deep: false }));
  const timeouts = useRef<{ [key: string]: any }>({});
  const setCache = (identifier: string, object: any) => {
    runInAction(() => cache.current.set(identifier, object));
  };

  useSource(
    [level, key, Model()],
    (level, key) => level.source<C>({ gte: key, lte: key, sync: false }),
    ({ /*key,*/ value }) => {
      if (Model().is(value)) {
        if (instance) {
          merge(instance as any, value);
        } else {
          const root = Model().create(value, {
            load<CI, SI, TI>(Model: () => IType<CI, SI, TI>, id: string) {
              // const resolved = resolveIdentifier(Model(), root, id);
              // if (resolved) return resolved;

              if (!cache.current.has(id)) {
                log('load %s %s', Model().name, id);
                setCache(id, null);

                level
                  .get<CI>(id)
                  .then(
                    snapshot =>
                      setCache(id, Model().create(snapshot, getEnv(root))) // here we copy the env from the root so they share behaviour
                  )
                  .catch(err => log('load error %s %O', Model().name, err));
              }
              return cache.current.get(id);
            },
            onSnapshot(snapshot: C) {
              // brute force debounce
              // FIXME find reason why onSnapshot is called 5 times in a row
              const id = (snapshot as any)._id;
              if (timeouts.current[id]) clearTimeout(timeouts.current[id]);
              timeouts.current[id] = setTimeout(() => {
                pull(
                  once({ key: id, value: snapshot }),
                  level.sink({ windowSize: 1, windowTime: 1 })
                );
                log('wrote %O to level', snapshot);
              }, 100);
            },
            // getRoot() {
            //   return root;
            // },
          });
          setInstance(root);
        }
      } else {
        log('doc %O is not of type %s', value, Model().name);
      }
    }
  );

  // on unmount, destroy the MST node to clear up memory
  useEffect(
    () => () => {
      if (instance) {
        destroy(instance);
        // setInstance(null);
      }
      cache.current.clear();
    },
    []
  );

  return instance;
};
