import {
  IAnyModelType,
  Instance,
  SnapshotIn,
  addDisposer,
  onPatch,
  getSnapshot,
  getEnv,
  applyPatch,
  ISerializedActionCall,
  onAction,
  splitJsonPath,
  applySnapshot,
} from 'mobx-state-tree';
import { observable, runInAction, when } from 'mobx';
import { Storage, Patch } from '../storage/index';
import { generateId } from '../utils/id';
import { produce, applyPatches, Patch as ImmerPatch } from 'immer';
import { asyncReference, asPlaceholder } from './asyncReference';
import { Omit } from '../utils/typescript';
import dset from 'dset';

export interface GraphEnv {
  // observable view which triggers loading the instance from the storage as a side effect
  loadInstance<T extends IAnyModelType>(
    Type: T,
    id: string
  ): Instance<T> | null;
  getInstance<T extends IAnyModelType>(
    Type: T,
    id: string
  ): Promise<Instance<T>>;
}

abstract class BaseStore implements GraphEnv {
  cache = observable.map<string, Instance<IAnyModelType> | null>(
    {},
    { deep: false }
  );

  protected getSnapshot<T extends IAnyModelType>(
    Type: T,
    id: string
  ): Promise<SnapshotIn<T>> {
    throw new Error('must be implemented in subclass');
  }

  protected createInstance<T extends IAnyModelType>(
    Type: T,
    snapshot: SnapshotIn<T>,
    env: GraphEnv = this
  ): Instance<T> {
    const instance = Type.create(snapshot, env);
    this.cache.set(instance.id, instance);
    return instance;
  }

  async getInstance<T extends IAnyModelType>(
    Type: T,
    id: string
  ): Promise<Instance<T>> {
    await when(() => this.loadInstance(Type, id) != null);
    return this.loadInstance(Type, id) as any;
  }

  loadInstance<T extends IAnyModelType>(
    Type: T,
    id: string
  ): Instance<T> | null {
    if (!this.cache.has(id)) {
      runInAction(() => this.cache.set(id, null));

      // intentional sideeffect
      Promise.resolve().then(async () => {
        const snapshot = await this.getSnapshot(Type, id);
        runInAction(() => {
          try {
            this.cache.set(id, this.createInstance(Type, snapshot));
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
}

export class Store extends BaseStore {
  constructor(public storage: Storage) {
    super();

    // actively listen for updates to keep the store up to date
    storage.subscribe(patches => {
      for (const {
        s: id,
        t, // timestamp is not needed here
        ...patch
      } of patches) {
        const obj = this.cache.get(id[0]);
        if (obj == null) continue;

        const snapshot = JSON.parse(JSON.stringify(getSnapshot(obj)));
        try {
          dset(snapshot, patch.path as any, null);
          const newSnapshot = applyPatches(snapshot, [patch]);
          applySnapshot(obj, newSnapshot);
        } catch (e) {
          debugger;
        } finally {
        }
      }
    });
  }

  async getSnapshot<T extends IAnyModelType>(
    Type: T,
    id: string
  ): Promise<SnapshotIn<T>> {
    const snapshot = await this.storage.getObject(id);
    if (!Type.is(snapshot)) {
      console.error('snapshot is wrong', Type, snapshot);
      throw new Error('snapshot is wrong');
    }
    return snapshot as any;
  }

  record() {
    return new RecordingStore(
      this.storage,
      this.createInstance.bind(this),
      this.getInstance.bind(this)
    );
  }
}

class RecordingStore extends BaseStore {
  public readonly constructedAt = Date.now();

  public readonly patches = observable.array<{
    id: string;
    patch: ImmerPatch;
    inverse: ImmerPatch;
    action: ISerializedActionCall; // action null = create new
    timestamp: number;
  }>([], { deep: false });

  constructor(
    public storage: Storage,
    private parentCreateInstance: <T extends IAnyModelType>(
      Type: T,
      snapshot: SnapshotIn<T>
    ) => Instance<T>,
    private parentGetInstance: <T extends IAnyModelType>(
      Type: T,
      id: string
    ) => Promise<Instance<T>>
  ) {
    super();
  }

  protected createInstance<T extends IAnyModelType>(
    Type: T,
    snapshot: SnapshotIn<T>,
    env: GraphEnv = this
  ): Instance<T> {
    const instance = Type.create(snapshot, env);
    this.cache.set(instance.id, instance);

    let action: ISerializedActionCall;

    // we use actions to group patches for undo/redo functionality
    addDisposer(
      instance,
      onAction(instance, newAction => (action = newAction))
    );

    addDisposer(
      instance,
      onPatch(instance, (patch, inverse) => {
        // runInAction(() => {
        this.patches.push({
          id: instance.id,
          patch: { ...patch, path: splitJsonPath(patch.path) },
          inverse: { ...inverse, path: splitJsonPath(inverse.path) },
          action,
          timestamp: Date.now(),
        });
        // })
      })
    );

    return instance;
  }

  // make a clone of the parent instance
  async getSnapshot<T extends IAnyModelType>(
    Type: T,
    id: string
  ): Promise<SnapshotIn<T>> {
    return getSnapshot(await this.parentGetInstance(Type, id));
  }

  // this is the method to create a new instance
  newInstance<T extends IAnyModelType>(
    Type: T,
    snapshot: Omit<SnapshotIn<T>, 'id'> & Partial<Pick<SnapshotIn<T>, 'id'>>
  ): Instance<T> {
    const snapshotWithId = snapshot.id
      ? snapshot
      : {
          id: generateId() as SnapshotIn<T>['id'],
          ...snapshot,
        };
    // @ts-ignore
    const instance = this.createInstance(Type, snapshotWithId);

    const { id, ...definedProperties } = getSnapshot(instance);
    const action = { name: 'newInstance', args: [Type, snapshotWithId] };
    const timestamp = Date.now();

    produce(
      {},
      draft => Object.assign(draft, definedProperties),
      (patches, inversePatches) =>
        patches.forEach((patch, i) => {
          const inverse = inversePatches[i];
          this.patches.push({
            id,
            patch,
            inverse,
            action,
            timestamp,
          });
        })
    );

    return instance;
  }

  async commit(): Promise<boolean> {
    const currentPatches = this.patches.splice(0, this.patches.length);
    try {
      currentPatches
        .filter(patch => patch.action.name === 'newInstance')
        .map(patch => patch.action)
        .filter((item, i, a) => a.indexOf(item) === i)
        .forEach(action => {
          if (action.args && action.args.length >= 2) {
            this.parentCreateInstance(action.args![0], action.args![1]);
          }
        });

      // use immer to compress patches
      // https://medium.com/@dedels/using-immer-to-compress-immer-patches-f382835b6c69
      const stampedPatches: Patch[] = [];

      const patchesPerId = currentPatches.reduce(
        (perId, { id, patch }) => {
          if (perId[id] == null) {
            perId[id] = [patch];
          } else {
            perId[id].push(patch);
          }
          return perId;
        },
        {} as { [id: string]: ImmerPatch[] }
      );

      for (const [id, patches] of Object.entries(patchesPerId)) {
        produce(
          {},
          draft => Object.assign(draft, applyPatches(draft, patches)),
          patches => {
            stampedPatches.push(
              ...patches.map(patch => ({ ...patch, s: [id] }))
            );
          }
        );
      }
      await this.storage.mergePatches(stampedPatches);
      return true;
    } catch (e) {
      console.error('commit failed', e);
      this.patches.splice(0, 0, ...currentPatches);
    }
    return false;
  }
}

export function referenceTo<IT extends IAnyModelType>(Type: IT) {
  // TODO do something with safeReference?
  return asyncReference(Type, (identifier, parent) => {
    if (parent == null) throw new Error('parent must be defined');
    const env = getEnv<GraphEnv>(parent);
    return env.getInstance(Type, `${identifier}`);
  });
}

export const asReference = asPlaceholder;
// // create an object with 1 prop which is typed to the value
// const objFromProp = <T extends string, U>(
//   name: T,
//   value: U
// ): { [key in T]: U } => ({ [name]: value } as any);

// const createM = <T extends string>(prop: T) => {
//   return types.model('any', objFromProp(prop, types.string));
// };

// // export function hasMany
