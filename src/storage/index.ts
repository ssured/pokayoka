import dlv from 'dlv';
import dset from 'dset';
import mlts from 'monotonic-lexicographic-timestamp';
import SubscribableEvent from 'subscribableevent';
import { JsonArray, JsonPrimitive } from '../utils/json';
import {
  BatchOperations,
  KeyType,
  StorageAdapter,
  ValueType,
} from './adapters/shared';
import { ham } from './ham';
import console = require('console');

function isObject(x: any): x is object {
  return (typeof x === 'object' && x !== null) || typeof x === 'function';
}

function isO(v: any): v is o {
  switch (typeof v) {
    case 'string':
    case 'boolean':
    case 'number':
      return true;
    case 'object':
      return v == null || Array.isArray(v);
  }
  return false;
}

type JsonArrayNotContainingAnyMap = (JsonPrimitive | JsonArray)[];

export type timestamp = string;
type s = string[];
type p = string;
type o = JsonPrimitive | JsonArrayNotContainingAnyMap;
interface Tuple {
  s: s;
  p: p;
  o: o;
}
interface StampedTuple extends Tuple {
  t: timestamp;
}

interface RFC6902Patch {
  op: 'replace' | 'remove' | 'add';
  path: (string | number)[];
  value?: any;
}

export interface Patch extends RFC6902Patch {
  s: s;
}

export interface StampedPatch extends Patch {
  t: timestamp;
}

interface UnIdentifiedStorableObject {
  [key: string]: UnIdentifiedStorableObject | o;
}

export interface StorableObject extends UnIdentifiedStorableObject {
  id: string;
}

export interface StorableObjectInverse {
  [key: string]: s[];
}

function createOperationsForDeferredTuple(
  tuple: StampedTuple,
  type: 'del' | 'put' = 'put'
): BatchOperations {
  const { s, p, o, t } = tuple;
  const pairs: { key: KeyType; value: ValueType }[] = [
    { key: ['spt', s, p, t], value: [o] }, // used to store future values, wrap o as [o] to support storing o = null
    { key: ['tsp', t, s, p], value: true }, // timeline of current values and future updates
    // { key: ['st', s, t], value: true }, // what is the next update for a subject?
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
  ];
  if (!Array.isArray(o)) {
    pairs.push({ key: ['ops', o, p, s], value: true });
    // { key: ['sop', s, o, p], value: true },
    // { key: ['osp', o, s, p], value: true },
    // { key: ['pos', p, o, s], value: true },
  }
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
    return (await this.adapter.queryList<[string, s, p, timestamp], [o]>({
      gt: ['spt', s, p, ''],
      lte: ['spt', s, p, machineState],
    })).map(({ key: [, s, p, t], value: [o] }) => ({ s, p, o, t }));
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

  public slowlyMergeObject(obj: StorableObject): Promise<boolean> {
    const { id, ...other } = obj;

    // TODO this can be optimised as merge will be called lots of times, and merge will
    // lookup all combinations of s,p separately from the 'sp' database.
    // probably this function is not called very often
    console.info(
      'writeRawSnapshot is slow, please only write patches. Also note object values are not allowed'
    );

    // all writes are at the same moment
    const machineState = this.getMachineState();

    const tuples: StampedTuple[] = [...spoInObject([id], other, machineState)];

    return this.mergeTuples(tuples);
  }

  public async getObject(id: string): Promise<StorableObject> {
    const tuples = await this.adapter
      .queryList<[string, s, p], [timestamp, o]>({
        gte: ['sp', [id]],
        lt: ['sp', [id, []]],
      })
      .then(result =>
        result.map(({ key: [, s, p], value: [, o] }) => ({ s, p, o } as Tuple))
      );

    const object: StorableObject = { id };

    for (const { s, p, o } of tuples) {
      dset(object, s.slice(1).concat(p), o);
    }

    return object;
  }

  public async getInverse(s: s, p?: p): Promise<StorableObjectInverse> {
    const tuples = await this.adapter
      .queryList<[string, o, p, s], true>({
        gte: ['ops', s, p ? p : ''],
        lt: ['ops', s, p ? p : []],
      })
      .then(result =>
        result.map(({ key: [, o, p, s] }) => ({ s, p, o } as Tuple))
      );

    const object: StorableObjectInverse = {};

    for (const { p, s } of tuples) {
      const entry = dlv<StorableObjectInverse[string] | undefined>(object, p);
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
  console.log({ op, path, s });
  return {
    s: s.concat(path.map(String).slice(0, -1)),
    p: path.map(String).slice(-1)[0],
    o: op === 'remove' ? null : typeof value === 'undefined' ? null : value,
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
    s: s.slice(0, 1),
    t,
    op: 'replace',
    path: s.slice(1).concat(p),
    value: o,
  };
}

function* spoInObject(
  s: s,
  obj: UnIdentifiedStorableObject,
  t: timestamp
): IterableIterator<StampedTuple> {
  for (const [key, value] of Object.entries(obj)) {
    if (isO(value)) {
      yield { s, p: key, o: value, t };
    } else if (isObject(value)) {
      // TODO this will be possible!
      if (Array.isArray(value)) {
        throw new Error(
          'cannot write arrays in graph, except subject references'
        );
      }
      yield* spoInObject(s.concat(key), value, t);
    }
  }
}
