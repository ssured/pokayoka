import mlts from 'monotonic-lexicographic-timestamp';
import { IJsonPatch, splitJsonPath, joinJsonPath } from 'mobx-state-tree';

import {
  StorageAdapter,
  BatchOperations,
  KeyType,
  ValueType,
} from './adapters/shared';
import { ham } from './ham';
import SubscribableEvent from 'subscribableevent';
import { JsonPrimitive } from '../utils/json';
import dset from 'dset';
import dlv from 'dlv';

type oReference = [string];

function isOReference(v: any): v is oReference {
  return Array.isArray(v) && v.length === 1 && typeof v[0] === 'string';
}

function isObject(x: any): x is object {
  return (typeof x === 'object' && x !== null) || typeof x === 'function';
}

function isO(v: any): v is o {
  switch (typeof v) {
    case 'boolean':
    case 'number':
    case 'string':
      return true;
    case 'object':
      return v == null || isOReference(v);
  }
  return false;
}

export type timestamp = string;
type s = string;
type p = string[];
type o = JsonPrimitive | oReference;
interface Tuple {
  s: s;
  p: p;
  o: o;
}
interface StampedTuple extends Tuple {
  t: timestamp;
}

export interface Patch extends IJsonPatch {
  s: s;
}

export interface StampedPatch extends Patch {
  t: timestamp;
}

type StorableValue = o | StorableObject;

interface StorableObject {
  [key: string]: StorableValue;
}

export interface IdentifiedStorableObject extends StorableObject {
  id: s;
}

export interface StorageInverse {
  [key: string]: s[];
}

function createOperationsForDeferredTuple(
  tuple: StampedTuple,
  type: 'del' | 'put' = 'put'
): BatchOperations {
  const { s, p, o, t } = tuple;
  const pairs: { key: KeyType; value: ValueType }[] = [
    { key: ['spt', s, p, t], value: o }, // used to store future values
    // { key: ['st', s, t], value: true }, // what is the next update for a subject?
    // { key: ['tsp', t, s, p], value: true },
  ];
  return type === 'put'
    ? pairs.map(pair => ({ ...pair, type }))
    : pairs.map(({ key }) => ({ key, type }));
}

function operationsForTuple(
  tuple: StampedTuple,
  type: 'del' | 'put'
): BatchOperations {
  const { s, p, o, t } = tuple;
  const pairs: { key: KeyType; value: ValueType }[] = [
    { key: ['sp', s, p], value: [t, o] }, // only one value can exist for s+p
    // { key: ['ps', p, s], value: o },
    // { key: ['sop', s, o, p], value: true },
    { key: ['ops', o, p, s], value: true },
    // { key: ['osp', o, s, p], value: true },
    // { key: ['pos', p, o, s], value: true },
  ];
  const ops =
    type === 'put'
      ? pairs.map(pair => ({ ...pair, type }))
      : pairs.map(({ key }) => ({ key, type }));
  return [...ops, ...createOperationsForDeferredTuple(tuple, type)];
}

function createOperations(
  toAdd: StampedTuple,
  toRemove: StampedTuple[] = []
): BatchOperations {
  return toRemove
    .flatMap(tuple => operationsForTuple(tuple, 'del'))
    .concat(...operationsForTuple(toAdd, 'put'));
}

function isObjectOrFunction(obj: any): boolean {
  return (
    obj != null &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    !Array.isArray(obj)
  );
}

export const numberToState = (n?: number) =>
  typeof n === 'number' ? mlts(n) : mlts();

export class Storage {
  private updatedTuplesEmitter = new SubscribableEvent<
    (tuples: StampedPatch[]) => void
  >();
  public subscribe(listener: (tuples: StampedPatch[]) => void) {
    const subscription = this.updatedTuplesEmitter.subscribe(listener);
    return () => subscription.unsubscribe();
  }

  constructor(
    private adapter: StorageAdapter,
    public getMachineState = numberToState()
  ) {}

  private async getCurrent(
    s: s,
    p: p,
    machineState = this.getMachineState()
  ): Promise<StampedTuple[]> {
    return (await this.adapter.queryList<[string, s, p, timestamp], o>({
      gt: ['spt', s, p, ''],
      lte: ['spt', s, p, machineState],
    })).map(({ key: [, s, p, t], value: o }) => ({ s, p, o, t }));
  }

  // merge a tuple with the current db
  // returns a boolean which tells if the passed tuple is now the current tuple
  private async mergeTuple(
    incomingTuple: StampedTuple,
    machineState = this.getMachineState()
  ): Promise<boolean> {
    const currentTuples = await this.getCurrent(
      incomingTuple.s,
      incomingTuple.p,
      machineState
    );

    const currentTuple =
      currentTuples.length === 0
        ? undefined
        : currentTuples[currentTuples.length - 1];

    let operations: BatchOperations = [];
    let merged = false;
    if (currentTuple === undefined) {
      if (machineState < incomingTuple.t) {
        operations = createOperationsForDeferredTuple(incomingTuple);
      } else {
        operations = createOperations(incomingTuple, currentTuples);
      }
    } else {
      const comparison = ham(
        machineState,
        incomingTuple.t,
        currentTuple.t,
        incomingTuple.o,
        currentTuple.o
      );

      if (comparison.resolution === 'merge' && comparison.incoming) {
        operations = createOperations(incomingTuple, currentTuples);
        merged = true;
      } else if (comparison.resolution === 'defer') {
        operations = createOperationsForDeferredTuple(incomingTuple);
      }
    }

    if (operations.length > 0) {
      await this.commit(operations);
    }

    return merged;
  }

  private async commit(operations: BatchOperations) {
    try {
      await this.adapter.batch(operations);
    } catch (e) {
      throw e;
    }

    const propertyUpdateTuples: StampedTuple[] = operations
      .filter(
        op => op.type === 'put' && Array.isArray(op.key) && op.key[0] === 'sp'
      )
      .map(
        // @ts-ignore
        ({ key: [, s, p], value: [t, o] }) => ({ s, p, o, t } as StampedTuple)
      );

    this.updatedTuplesEmitter.fire(
      propertyUpdateTuples.map(stampedTupleToStampedPatch)
    );
  }

  private async mergeTuples(
    tuples: StampedTuple[],
    machineState = this.getMachineState()
  ): Promise<boolean> {
    const merges = tuples.map(tuple => this.mergeTuple(tuple, machineState));

    const results = await Promise.all(merges);

    return results.reduce((res, subRes) => res || subRes, false) || false;
  }

  public slowlyMergeObject(obj: IdentifiedStorableObject): Promise<boolean> {
    const { id, ...other } = obj;

    // TODO this can be optimised as merge will be called lots of times, and merge will
    // lookup all combinations of s,p separately from the 'sp' database.
    // probably this function is not called very often
    console.info(
      'writeRawSnapshot is slow, please only write patches. Also note object values are not allowed'
    );

    // all writes are at the same moment
    const machineState = this.getMachineState();

    const tuples: StampedTuple[] = [];
    for (const [p, rawO] of poInObject(other)) {
      tuples.push({ s: id, p, o: rawO as o, t: machineState });
    }

    return this.mergeTuples(tuples);
  }

  public async getObject(s: s): Promise<IdentifiedStorableObject> {
    const tuples = await this.adapter
      .queryList<[string, s, p], [timestamp, o]>({
        gt: ['sp', s, []],
        lt: ['sp', s, [[]]],
      })
      .then(result =>
        result.map(({ key: [, s, p], value: [, o] }) => ({ s, p, o } as Tuple))
      );

    const object: IdentifiedStorableObject = { id: s };

    for (const { p, o } of tuples) {
      dset(object, p, o);
    }

    return object;
  }

  public async getInverse(s: s): Promise<StorageInverse> {
    const tuples = await this.adapter
      .queryList<[string, o, p, s], true>({
        gt: ['ops', [s], []],
        lt: ['ops', [s], [[]]],
      })
      .then(result =>
        result.map(({ key: [, o, p, s] }) => ({ s, p, o } as Tuple))
      );

    const object: StorageInverse = {};

    for (const { p, s } of tuples) {
      const entry = dlv<StorageInverse[string] | undefined>(object, p);
      if (Array.isArray(entry)) {
        entry[entry.length] = s;
      } else {
        dset(object, p, [s]);
      }
    }

    return object;
  }

  private stampPatch(
    patch: Patch | StampedPatch,
    machineState = this.getMachineState()
  ): StampedPatch {
    // @ts-ignore
    return typeof patch.t === 'string' ? patch : { ...patch, t: machineState };
  }

  public async mergePatches(
    patches: (Patch | StampedPatch)[]
  ): Promise<boolean> {
    const machineState = this.getMachineState();
    const stampedPatches = patches.map(patch =>
      this.stampPatch(patch, machineState)
    );

    const stampedTuples = stampedPatches.map(stampedPatchToStampedTuple);

    return this.mergeTuples(stampedTuples, machineState);
  }
}

function stampedPatchToStampedTuple({
  s,
  t,
  op,
  path,
  value,
}: StampedPatch): StampedTuple {
  return {
    s,
    p: splitJsonPath(path),
    o: op === 'remove' ? undefined : value,
    t,
  };
}

// TODO always sends a replace, but could be an 'add'. Maybe not needed. Research
function stampedTupleToStampedPatch({
  s,
  p,
  o,
  t,
}: StampedTuple): StampedPatch {
  return {
    s,
    t,
    op: 'replace',
    path: joinJsonPath(p),
    value: o,
  };
}

function* poInObject(obj: StorableObject): IterableIterator<[p, o]> {
  for (const [key, value] of Object.entries(obj)) {
    if (isO(value)) {
      yield [[key], value];
    } else if (isObject(value)) {
      if (Array.isArray(value)) {
        throw new Error(
          'cannot write arrays in graph, except subject references'
        );
      }
      for (const [path, innerVal] of poInObject(value)) {
        yield [[key].concat(path), innerVal];
      }
    }
  }
}
