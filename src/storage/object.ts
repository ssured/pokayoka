import { JsonMap, JsonEntry } from '../utils/json';
import { hash } from './hash';
import { Storage, subj, timestamp, pred, Tuple, StampedTuple } from './index';

import { queryResult, query, variable, objt } from '../storage/index';

export { queryResult, query, variable, objt };

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

type querySinceOptions = {
  skipFirst?: boolean;
};

export class ObjectStorage extends Storage {
  public subscribe(listener: (tuples: StampedPatch[]) => void) {
    const subscription = this.committedTransactions.subscribe(transactions => {
      const tuples = [...transactions].flatMap(transaction => [...transaction]);
      listener(tuples.map(stampedTupleToStampedPatch));
    });
    return () => subscription.unsubscribe();
  }

  /**
   * Return all patches since timestamp
   */
  public async *patchesSince(
    timestamp: timestamp,
    options: querySinceOptions = {}
  ): AsyncIterableIterator<[timestamp, StampedPatch]> {
    for await (const [logT, tuple] of this.tuplesSince(timestamp, options)) {
      yield [logT, stampedTupleToStampedPatch(tuple)];
    }
  }

  public async mergePatches(
    patches: (Patch | StampedPatch)[],
    machineState = this.getMachineState()
  ) {
    const stampedPatches = patches.map(patch =>
      stampPatch(patch, machineState)
    );

    const stampedTuples = stampedPatches.map(stampedPatchToStampedTuple);

    return this.enqueueTuples(stampedTuples, machineState);
  }

  public slowlyMergeObject(obj: StorableObject) {
    const { id, ...other } = obj;

    // all writes are at the same moment
    const machineState = this.getMachineState();

    return this.enqueueTuples(
      spoInObject([id], other, machineState),
      machineState
    );
  }

  protected async getNested(s: subj, deep: boolean = false): Promise<JsonMap> {
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
): Iterable<StampedTuple> {
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

function stampPatch(
  patch: Patch | StampedPatch,
  machineState: timestamp
): StampedPatch {
  return 't' in patch ? patch : { ...patch, t: machineState };
}
