import dlv from 'dlv';
import dset from 'dset';
import mlts from 'monotonic-lexicographic-timestamp';
import SubscribableEvent from 'subscribableevent';
import { JsonPrimitive, JsonMap, JsonEntry } from '../utils/json';
import {
  BatchOperations,
  KeyType,
  StorageAdapter,
  ValueType,
} from './adapters/shared';
import { ham } from './ham';
import { hash } from './hash';

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
      return (
        v == null ||
        (Array.isArray(v) && v.reduce((allO, item) => allO && isO(item), true))
      );
  }
  return false;
}

export type timestamp = string;
type s = string[];
type p = string;
type o = JsonPrimitive | string[];
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

export interface StorableObject {
  id: string;
  [key: string]: JsonEntry;
}

export interface StorableObjectInverse {
  [key: string]: s[];
}

function createOperationsForTimeline(
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

function createOperationsForStore(
  tuple: StampedTuple,
  type: 'del' | 'put'
): BatchOperations {
  const { s, p, o, t } = tuple;
  const pairs: { key: KeyType; value: ValueType }[] = [
    { key: ['sp', s, p], value: [t, o] }, // only one value can exist for s+p
    // { key: ['ps', p, s], value: [o] },
    { key: ['ops', o, p, s], value: true },
    // { key: ['sop', s, o, p], value: true },
    // { key: ['osp', o, s, p], value: true },
    // { key: ['pos', p, o, s], value: true },
  ];
  const ops =
    type === 'put'
      ? pairs.map(pair => ({ ...pair, type }))
      : pairs.map(({ key }) => ({ key, type }));
  return [...ops, ...createOperationsForTimeline(tuple, type)];
}

function createOperations(
  toAdd: StampedTuple,
  toRemove: StampedTuple[] = []
): BatchOperations {
  return toRemove
    .flatMap(tuple => createOperationsForStore(tuple, 'del'))
    .concat(...createOperationsForStore(toAdd, 'put'));
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
        operations = createOperationsForTimeline(incomingTuple);
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
        operations = createOperationsForTimeline(incomingTuple);
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

  private async queueTransaction(
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

    return this.queueTransaction(tuples, machineState);
  }

  private async getNested(s: s, deep: boolean = false): Promise<JsonMap> {
    const tuples = await this.adapter
      .queryList<[string, s, p], [timestamp, o]>({
        gte: ['sp', s],
        lt: ['sp', [...s, []]],
      })
      .then(result =>
        result.map(({ key: [, s, p], value: [, o] }) => ({ s, p, o } as Tuple))
      );

    const object: JsonMap = {};

    for (const { s, p, o } of tuples) {
      setObjectAtSP(
        object,
        s,
        p,
        deep && !isO(o) ? await this.getNested(o) : o
      );
    }

    return object;
  }

  public async getObject(
    id: string,
    deep: boolean = false
  ): Promise<StorableObject> {
    return { ...(await this.getNested([id], deep)), id };
  }

  public async getInverse(
    obj: StorableObject,
    property?: p
  ): Promise<StorableObjectInverse> {
    const s: s = [obj.id];
    const tuples = await this.adapter
      .queryList<[string, o, p, s], true>({
        gt: ['ops', s, property ? property : '', null],
        lt: ['ops', s, property ? property : [], undefined],
      })
      .then(result => {
        return result.map(({ key: [, o, p, s] }) => ({ s, p, o } as Tuple));
      });

    const object: StorableObjectInverse = {};

    for (const { p, s } of tuples) {
      const entry = dlv<s[] | undefined>(object, s.slice(1).concat(p));
      if (Array.isArray(entry)) {
        entry[entry.length] = s;
      } else {
        dset(object, isArrayKey(p) ? removeArrayKey(p) : p, [s]);
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

    return this.queueTransaction(stampedTuples, machineState);
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

function isArrayKey(key: any) {
  return typeof key === 'string' && key.match(/\[\]$/) != null;
}
function makeArrayKey(key: string) {
  return `${key}[]`;
}
function removeArrayKey(key: string) {
  return key.substr(0, key.length - 2);
}

export function* spoInObject(
  s: s,
  obj: JsonMap,
  t: timestamp
): IterableIterator<StampedTuple> {
  for (const [key, value] of Object.entries(obj)) {
    if (isO(value)) {
      yield { s, p: key, o: value, t };
    } else if (isObject(value)) {
      if (Array.isArray(value)) {
        for (const [index, itemValue] of value.entries()) {
          const arrayKey = makeArrayKey(key);
          const arraySubj = s.concat(arrayKey);

          // create a property name which guarantees to be unique for the
          // - subject `...s`
          // - the predicate `key`
          // - the position in the array `index`
          // - the value of the item
          // its maybe inefficient, but items in the array will never collide this way.

          const hashIndex = hash([...s, key, index, itemValue]);
          yield* spoInObject(arraySubj, { [hashIndex]: itemValue }, t);
        }
        return;
      }
      yield* spoInObject(s.concat(key), value, t);
    }
  }
}

const arrayHashMap = new WeakMap<any, Set<string>>();

function itemHasKey(item: any, key: string): boolean {
  return arrayHashMap.has(item) && arrayHashMap.get(item)!.has(key);
}

function itemAddKey(item: any, key: string): void {
  if (typeof item !== 'object') return;

  if (!arrayHashMap.has(item)) {
    arrayHashMap.set(item, new Set<string>([key]));
    return;
  }

  arrayHashMap.get(item)!.add(key);
}

function getObjectAtSP(source: JsonMap, s: s, p: p): any {
  let pointer: any = source;
  for (const rawKey of s.slice(1).concat(p)) {
    if (typeof pointer !== 'object') {
      return undefined;
    }

    const isArray = isArrayKey(rawKey);
    const key = isArray ? removeArrayKey(rawKey) : rawKey;

    if (
      (isArray && !Array.isArray(pointer[key])) ||
      (!isArray && !pointer.hasOwnProperty(key))
    ) {
      return undefined;
    }

    if (Array.isArray(pointer)) {
      pointer = pointer.find((item: any) => itemHasKey(item, key));
      if (pointer == null) return undefined;
    } else {
      pointer = pointer[key];
    }
  }
  return pointer;
}

function setObjectAtSP(source: JsonMap, s: s, p: p, value: any): any {
  let pointer: any = source;
  for (const rawKey of s.slice(1)) {
    const keyIsArray = isArrayKey(rawKey);
    const key = keyIsArray ? removeArrayKey(rawKey) : rawKey;

    if (Array.isArray(pointer)) {
      let item = pointer.find((item: any) => itemHasKey(item, key));
      if (item == null) {
        item = keyIsArray ? [] : {};
        itemAddKey(item, key);
        pointer.push(item);
      }
      pointer = item;
    } else {
      // pointer is object
      if (
        !pointer.hasOwnProperty(key) ||
        pointer[key] == null ||
        typeof pointer[key] !== 'object'
      ) {
        pointer[key] = keyIsArray ? [] : {};
      }
      pointer = pointer[key];
    }
  }

  if (Array.isArray(pointer)) {
    const currentIndex = pointer.find((item: any) => itemHasKey(item, p));
    if (currentIndex > -1) {
      pointer.splice(currentIndex, 1);
    }
    itemAddKey(value, p);
    pointer.push(value);
  } else {
    pointer[p] = value;
  }
}
