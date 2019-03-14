import mlts from 'monotonic-lexicographic-timestamp';
import SubscribableEvent from 'subscribableevent';
import { JsonPrimitive, JsonMap, JsonEntry } from '../utils/json';
import { BatchOperations, StorageAdapter } from './adapters/shared';
import { ham } from './ham';
import { hash } from './hash';
import { CharwiseKey } from 'charwise';

function isObject(x: any): x is object {
  return (typeof x === 'object' && x !== null) || typeof x === 'function';
}

function isObjt(v: any): v is objt {
  switch (typeof v) {
    case 'string':
    case 'boolean':
    case 'number':
      return true;
    case 'object':
      return (
        v == null ||
        (Array.isArray(v) &&
          v.length > 0 &&
          v.reduce((allO, item) => allO && isObjt(item), true))
      );
  }
  return false;
}

export type timestamp = string;
export type subj = string[];
export type pred = string;
export type objt = JsonPrimitive | ([string] & string[]);
type indexes = 'spo' | 'sop' | 'pso' | 'pos' | 'ops' | 'osp' | 'spt' | 'log';
interface Tuple {
  s: subj;
  p: pred;
  o: objt;
}

type queryVariable = {
  '#': string;
  $: (val: subj | pred | objt) => subj | pred | objt;
};
export type queryResult = {
  tuples: (Tuple)[];
  variables: { [key: string]: subj | pred | objt };
};
export type query = {
  s?: subj | queryVariable | { gte: subj | []; lt: subj | [undefined] };
  p?: pred | queryVariable | { gte: pred | []; lt: pred | [undefined] };
  o?:
    | objt
    | queryVariable
    | { gte: objt | []; lt: objt | undefined | [undefined] };
  filter?: (tuple: Tuple) => boolean;
};

type KeyType = CharwiseKey;
type ValueType = JsonEntry;

interface StampedTuple extends Tuple {
  t: timestamp;
}

interface RFC6902Patch {
  op: 'replace' | 'remove' | 'add';
  path: (string | number)[];
  value?: any;
}

export interface Patch extends RFC6902Patch {
  s: subj;
}

export interface StampedPatch extends Patch {
  t: timestamp;
}

export interface StorableObject {
  id: string;
  [key: string]: JsonEntry;
}

export interface StorableObjectInverse {
  [key: string]: subj[];
}

function createOperationsForTimeline(
  tuple: StampedTuple,
  type: 'del' | 'put' = 'put'
): BatchOperations {
  const { s, p, o, t } = tuple;
  return type === 'put'
    ? [{ type: 'put', key: ['spt', s, p, t], value: [o] }] // used to store future values, wrap o as [o] to support storing o = null
    : [{ type: 'del', key: ['spt', s, p, t] }];
}

function createOperationsForStore(
  tuple: StampedTuple,
  type: 'del' | 'put',
  machineState: timestamp
): BatchOperations {
  const { s, p, o, t } = tuple;
  const pairs: { key: KeyType; value: ValueType }[] = [
    { key: ['log', machineState, s, p, o, t], value: true },
    { key: ['spo', s, p, o], value: [t, machineState] },
    // { key: ['pso', p, s, o], value: true },
    { key: ['ops', o, p, s], value: true },
    { key: ['sop', s, o, p], value: true },
    // { key: ['osp', o, s, p], value: true },
    { key: ['pos', p, o, s], value: true },
  ];
  const ops =
    type === 'put'
      ? pairs.map(pair => ({ ...pair, type }))
      : pairs
          .filter(({ key }) => (key as any)[0] !== 'log')
          .map(({ key }) => ({ key, type }));
  return [...ops, ...createOperationsForTimeline(tuple, type)];
}

function createOperations(
  toAdd: StampedTuple,
  toRemove: StampedTuple[] = [],
  machineState: timestamp
): BatchOperations {
  return toRemove
    .flatMap(tuple => createOperationsForStore(tuple, 'del', machineState))
    .concat(...createOperationsForStore(toAdd, 'put', machineState));
}

export const numberToState = (n?: number) =>
  typeof n === 'number' ? mlts(n) : mlts();

type querySinceOptions = {
  skipFirst?: boolean;
};
export class Storage {
  private id: string | null = null;

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

  public async getStorageId(): Promise<string> {
    if (this.id) return this.id;

    const key: [undefined, string] = [undefined, 'database-id'];
    const ids = await this.adapter.queryList<typeof key, string>({
      gte: key,
      lte: key,
    });

    if (ids.length === 1) {
      return (this.id = ids[0].value);
    }

    const newId = hash([Date.now(), Math.random().toString(36)]);

    await this.adapter.batch([{ key, value: newId, type: 'put' }]);

    return (this.id = newId);
  }

  public async timestampForStorage(storageId: string): Promise<timestamp> {
    const key: [undefined, string, string] = [
      undefined,
      'remote-timestamp',
      storageId,
    ];
    const timestamps = await this.adapter.queryList<typeof key, timestamp>({
      gte: key,
      lte: key,
    });

    return timestamps.length === 1 ? timestamps[0].value : '';
  }

  public async updateTimestampForStorage(
    storageId: string,
    timestamp: timestamp
  ): Promise<void> {
    const key: [undefined, string, string] = [
      undefined,
      'remote-timestamp',
      storageId,
    ];
    return this.adapter.batch([{ key, value: timestamp, type: 'put' }]);
  }

  private async *tuplesSince(
    timestamp: timestamp,
    options: querySinceOptions = {}
  ): AsyncIterableIterator<[timestamp, StampedTuple]> {
    let latest: timestamp | null = null;

    const { skipFirst }: querySinceOptions = { skipFirst: false, ...options };

    for await (const {
      key: [_, logT, s, p, o, t],
    } of this.adapter.query<
      [string, timestamp, subj, pred, objt, timestamp],
      true
    >({
      gte: ['log', timestamp + (skipFirst ? '!' : '')],
      lt: ['log', undefined],
    })) {
      yield [logT, { s, p, o, t }];
      latest = t;
    }

    // repeat until we get an empty result
    if (latest != null) {
      yield* this.tuplesSince(latest, { ...options, skipFirst: true });
    }
  }

  public async *patchesSince(
    timestamp: timestamp,
    options: querySinceOptions = {}
  ): AsyncIterableIterator<[timestamp, StampedPatch]> {
    for await (const [logT, tuple] of this.tuplesSince(timestamp, options)) {
      yield [logT, stampedTupleToStampedPatch(tuple)];
    }
  }

  private async getCurrent(
    s: subj,
    p: pred,
    machineState = this.getMachineState()
  ): Promise<StampedTuple[]> {
    return (await this.adapter.queryList<
      [string, subj, pred, timestamp],
      [objt]
    >({
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
        operations = createOperations(
          incomingTuple,
          currentTuples,
          machineState
        );
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
        operations = createOperations(
          incomingTuple,
          currentTuples,
          machineState
        );
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
        op => op.type === 'put' && Array.isArray(op.key) && op.key[0] === 'spo'
      )
      .map(
        // @ts-ignore
        ({ key: [, s, p, o], value: [t] }) => ({ s, p, o, t } as StampedTuple)
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
    // lookup all combinations of s,p separately from the 'spo' database.
    // probably this function is not called very often
    console.info(
      'writeRawSnapshot is slow, please only write patches. Also note object values are not allowed'
    );

    // all writes are at the same moment
    const machineState = this.getMachineState();

    const tuples: StampedTuple[] = [...spoInObject([id], other, machineState)];

    return this.queueTransaction(tuples, machineState);
  }

  private async getNested(s: subj, deep: boolean = false): Promise<JsonMap> {
    const tuples = await this.adapter
      .queryList<[string, subj, pred, objt], [timestamp, timestamp]>({
        gte: ['spo', s],
        lt: ['spo', [...s, []]],
      })
      .then(result =>
        result.map(
          ({ key: [, s, p, o] /*, value: t*/ }) => ({ s, p, o } as Tuple)
        )
      );

    const object: JsonMap = {};

    for (const { s, p, o } of tuples) {
      setObjectAtSP(
        object,
        s,
        p,
        deep && !isObjt(o) ? await this.getNested(o) : o
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
    property?: pred
  ): Promise<StorableObjectInverse> {
    const s: subj = [obj.id];
    const tuples = await this.adapter
      .queryList<[string, objt, pred, subj], true>({
        gt: ['ops', s, property ? property : '', null],
        lt: ['ops', s, property ? property : [], undefined],
      })
      .then(result => {
        return result.map(({ key: [, o, p, s] }) => ({ s, p, o } as Tuple));
      });

    const object: StorableObjectInverse = {};

    for (const { p, s } of tuples) {
      const entry = getObjectAtSP(object, s, p);
      if (Array.isArray(entry)) {
        entry[entry.length] = s;
      } else {
        setObjectAtSP(object, s, p, [s]);
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

  private async *query<T extends indexes>(
    idx: T,
    p1?: T extends 'spo' | 'sop'
      ? subj | { gte: subj | []; lt: subj | [undefined] }
      : T extends 'pso' | 'pos'
      ? pred | { gte: pred | []; lt: pred | [undefined] }
      : objt | { gte: objt | []; lt: objt | undefined | [undefined] },
    p2?: T extends 'pso' | 'osp'
      ? subj | { gte: subj | []; lt: subj | [undefined] }
      : T extends 'ops' | 'spo'
      ? pred | { gte: pred | []; lt: pred | [undefined] }
      : objt | { gte: objt | []; lt: objt | undefined | [undefined] },
    p3?: T extends 'pos' | 'ops'
      ? { gte: subj | []; lt: subj | [undefined] }
      : T extends 'sop' | 'osp'
      ? { gte: pred | []; lt: pred | [undefined] }
      : { gte: objt | []; lt: objt | undefined | [undefined] }
  ): AsyncIterableIterator<Tuple> {
    const lowerBound: (subj | pred | objt)[] = [idx];
    const upperBound: (subj | pred | objt | undefined)[] = [idx];
    let includeUpperBound = false;

    if (typeof p1 !== 'undefined') {
      // @ts-ignore
      lowerBound.push(isRange(p1) ? p1.gte : p1);
      // @ts-ignore
      upperBound.push(isRange(p1) ? p1.lt : p1);
    }
    if (typeof p2 !== 'undefined') {
      // @ts-ignore
      lowerBound.push(isRange(p2) ? p2.gte : p2);
      // @ts-ignore
      upperBound.push(isRange(p2) ? p2.lt : p2);
    }
    if (typeof p3 !== 'undefined') {
      // @ts-ignore
      lowerBound.push(isRange(p3) ? p3.gte : p3);
      // @ts-ignore
      upperBound.push(isRange(p3) ? p3.lt : p3);
      includeUpperBound = true;
    } else {
      lowerBound.push(null);
      upperBound.push(undefined);
    }

    for await (const data of this.adapter.query({
      gte: lowerBound,
      [includeUpperBound ? 'lte' : 'lt']: upperBound,
    })) {
      const [idx, v0, v1, v2] = (data as any).key;
      yield { [idx[0]]: v0, [idx[1]]: v1, [idx[2]]: v2 } as Tuple;
    }
  }

  public async *ezq(
    queries: query[],
    result: queryResult = { tuples: [], variables: {} }
  ): AsyncIterableIterator<queryResult> {
    if (queries.length === 0) return;
    const {
      s = variable(),
      p = variable(),
      o = variable(),
      filter,
    } = queries[0];
    const fS =
      isVariable(s) && s['#'] !== '' && s['#'] in result.variables
        ? s.$(result.variables[s['#']])
        : s;
    const fP =
      isVariable(p) && p['#'] !== '' && p['#'] in result.variables
        ? p.$(result.variables[p['#']])
        : p;
    const fO =
      isVariable(o) && o['#'] !== '' && o['#'] in result.variables
        ? o.$(result.variables[o['#']])
        : o;

    const args: any = isVariable(fS)
      ? isVariable(fP)
        ? isVariable(fO)
          ? ['spo']
          : ['ops', fO]
        : isVariable(fO)
        ? ['pos', fP]
        : ['pos', fP, fO]
      : isVariable(fP)
      ? isVariable(fO)
        ? ['spo', fS]
        : ['sop', fS, fO]
      : isVariable(fO)
      ? ['spo', fS, fP]
      : ['spo', fS, fP, fO];

    for await (const tuple of this.query.apply(this, args)) {
      if (filter == null || filter(tuple)) {
        const newResult = clone(result);
        newResult.tuples.push(tuple);

        if (isVariable(fS)) newResult.variables[fS['#']] = tuple.s;
        if (isVariable(fP)) newResult.variables[fP['#']] = tuple.p;
        if (isVariable(fO)) newResult.variables[fO['#']] = tuple.o;

        if (queries.length === 1) {
          yield newResult;
        } else {
          yield* this.ezq(queries.slice(1), newResult);
        }
      }
    }
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
  s: subj,
  obj: JsonMap,
  t: timestamp
): IterableIterator<StampedTuple> {
  for (const [key, value] of Object.entries(obj)) {
    if (isObjt(value)) {
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
        continue;
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

function getObjectAtSP(source: JsonMap, s: subj, p: pred): any {
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

function setObjectAtSP(source: JsonMap, s: subj, p: pred, value: any): any {
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

function isRange(
  obj: any
): obj is {
  gte: subj | pred | objt;
  lt: subj | pred | objt;
} {
  return (
    obj != null &&
    typeof obj === 'object' &&
    Object.keys(obj).length === 2 &&
    'gte' in obj &&
    'lt' in obj
  );
}

function isVariable(arg: any): arg is queryVariable {
  return arg != null && typeof arg === 'object' && '#' in arg && '$' in arg;
}
export function variable(
  name: string = '',
  mapper: queryVariable['$'] = (i: any) => i
): queryVariable {
  return { '#': name, $: mapper };
}
function clone<T extends any>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
