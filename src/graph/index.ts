import {
  IAnyModelType,
  Instance,
  SnapshotIn,
  addDisposer,
  onPatch,
  getSnapshot,
  getType,
  IJsonPatch,
  IAnyComplexType,
  IReferenceType,
  types,
  getEnv,
  applyPatch,
} from 'mobx-state-tree';
import { observable, runInAction, when } from 'mobx';
import { Storage } from '../storage/index';

export interface GraphEnv {
  create<T extends IAnyModelType>(
    Type: T,
    snapshot: SnapshotIn<T>,
    env: GraphEnv
  ): Instance<T>;
  get<T extends IAnyModelType>(Type: T, id: string): Promise<Instance<T>>;
  load<T extends IAnyModelType>(Type: T, id: string): Promise<SnapshotIn<T>>;
  getOrLoad<T extends IAnyModelType>(Type: T, id: string): Instance<T> | null;
}

abstract class BaseStore implements GraphEnv {
  cache = observable.map<string, Instance<IAnyModelType> | null>(
    {},
    { deep: false }
  );

  load<T extends IAnyModelType>(Type: T, id: string): Promise<SnapshotIn<T>> {
    throw new Error('must be implemented downstream');
  }

  create<T extends IAnyModelType>(
    Type: T,
    snapshot: SnapshotIn<T>,
    env: GraphEnv = this
  ): Instance<T> {
    const instance = Type.create({ ...snapshot, id: snapshot.id[0] }, env);
    return instance;
  }

  getOrLoad<T extends IAnyModelType>(Type: T, id: string): Instance<T> | null {
    if (!this.cache.has(id)) {
      runInAction(() => this.cache.set(id, null));

      // intentional sideeffect
      Promise.resolve().then(async () => {
        const snapshot = await this.load(Type, id);
        runInAction(() => {
          try {
            this.cache.set(id, this.create(Type, snapshot));
          } catch (e) {
            console.error('Got error in getOrLoad');
            console.error(e);
            throw e;
          }
        });
      });
    }
    return this.cache.get(id);
  }

  async get<T extends IAnyModelType>(
    Type: T,
    id: string
  ): Promise<Instance<T>> {
    await when(() => this.getOrLoad(Type, id) != null);
    return this.getOrLoad(Type, id) as any;
  }
}

export class Store extends BaseStore {
  constructor(public storage: Storage) {
    super();

    // actively listen for updates to keep the store up to date
    storage.subscribe(patches => {
      for (const {
        s: [id],
        t, // timestamp is not needed here
        ...patch
      } of patches) {
        const obj = this.cache.get(id);
        if (obj == null) continue;
        applyPatch(obj, patch);
      }
    });
  }

  async load<T extends IAnyModelType>(
    Type: T,
    id: string
  ): Promise<SnapshotIn<T>> {
    const { id: arrId, ...other } = await this.storage.getObject([id]);
    const snapshot = { ...other, id: arrId[0] };
    if (!Type.is(snapshot)) {
      console.error('snapshot is wrong', Type, snapshot);
      throw new Error('snapshot is wrong');
    }
    return snapshot as any;
  }

  async record(object: Instance<IAnyModelType>) {
    if (!this.cache.has(object.id) || this.cache.get(object.id) !== object) {
      throw new Error('object does not belong to this store');
    }
    const forkedStore = new RecordingStore(this);
    return forkedStore.get(getType(object) as IAnyModelType, object.id);
  }
}

class RecordingStore extends BaseStore {
  public readonly constructedAt = Date.now();

  public readonly patches = observable.array<{
    id: string;
    patch: IJsonPatch;
    inverse: IJsonPatch;
    timestamp: number;
  }>([], { deep: false });

  constructor(private parent: Store) {
    super();
  }

  create<T extends IAnyModelType>(
    Type: T,
    snapshot: SnapshotIn<T>,
    env: GraphEnv = this
  ): Instance<T> {
    const instance = this.parent.create(Type, snapshot, env);

    addDisposer(
      instance,
      onPatch(instance, (patch, inverse) => {
        // runInAction(() => {
        this.patches.push({
          id: instance.id,
          patch,
          inverse,
          timestamp: Date.now(),
        });
        // })
      })
    );

    return instance;
  }

  // make a clone of the parent instance
  async load<T extends IAnyModelType>(
    Type: T,
    id: string
  ): Promise<SnapshotIn<T>> {
    return getSnapshot(await this.parent.get(Type, id));
  }
}

export function referenceTo<IT extends IAnyComplexType>(
  Type: IT
): IReferenceType<IT> {
  // TODO do something with safeReference?
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

// // create an object with 1 prop which is typed to the value
// const objFromProp = <T extends string, U>(
//   name: T,
//   value: U
// ): { [key in T]: U } => ({ [name]: value } as any);

// const createM = <T extends string>(prop: T) => {
//   return types.model('any', objFromProp(prop, types.string));
// };

// // export function hasMany
