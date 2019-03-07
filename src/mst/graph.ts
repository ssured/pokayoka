import {
  types,
  getEnv,
  IAnyModelType,
  Instance,
  IAnyComplexType,
  IReferenceType,
  ModelPropertiesDeclaration,
} from 'mobx-state-tree';
import { observable, runInAction, when } from 'mobx';
import { Db, RawSnapshot } from '../db/index';
import console = require('console');

export interface GraphEnv {
  getOrLoad<T extends IAnyModelType>(Type: T, id: string): Instance<T> | null;
  get<T extends IAnyModelType>(Type: T, id: string): Promise<Instance<T>>;
}

export function createEnv(db: Db) {
  const cache = observable.map<string, Instance<IAnyModelType> | null>(
    {},
    { deep: false }
  );

  const env: GraphEnv = {
    getOrLoad(Type, id) {
      if (!cache.has(id)) {
        runInAction(() => cache.set(id, null));

        // intentional sideeffect
        Promise.resolve().then(async () => {
          const snapshot = await db.getRawSnapshot(id);
          runInAction(() => {
            try {
              cache.set(id, Type.create(snapshot, { ...env }));
            } catch (e) {
              console.error('Got error in getOrLoad');
              console.error(e);
              throw e;
            }
          });
        });
      }
      return cache.get(id);
    },

    async get(Type, id) {
      await when(() => env.getOrLoad(Type, id) != null);
      return env.getOrLoad(Type, id) as any;
    },
  };
  return env;
}

export function referenceTo<IT extends IAnyComplexType>(
  Type: IT
): IReferenceType<IT> {
  return types.reference<IT>(Type, {
    get(identifier, parent) {
      if (parent == null) return null;
      const env = getEnv<GraphEnv>(parent);
      // @ts-ignore
      return env.getOrLoad(Type, identifier, env);
    },
    set(value) {
      // @ts-ignore
      return value.id;
    },
  });
}

// create an object with 1 prop which is typed to the value
const objFromProp = <T extends string, U>(
  name: T,
  value: U
): { [key in T]: U } => ({ [name]: value } as any);

const createM = <T extends string>(prop: T) => {
  return types.model('any', objFromProp(prop, types.string));
};

// export function hasMany
