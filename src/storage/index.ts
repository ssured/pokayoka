import {
  StorageAdapter,
  BatchOperations,
  KeyType,
  ValueType,
} from './adapters/shared';
import mlts from 'monotonic-lexicographic-timestamp';
import { ham } from './ham';

export const getCurrentState = mlts();

export type timestamp = ReturnType<typeof getCurrentState>;
type s = [string];
type p = string;
type o = null | string | number | s;
interface Tuple {
  s: s;
  p: p;
  o: o;
}
interface StampedTuple extends Tuple {
  t: timestamp;
}

export interface RawSnapshot {
  id: string;
  [key: string]: o | string[];
}

// export interface RawInverse {
//   id: string;
//   [key: string]: string | [string];
// }

function operationsForDeferredTuple(
  tuple: StampedTuple,
  type: 'del' | 'put' = 'put'
): BatchOperations {
  const { s, p, o, t } = tuple;
  const pairs: { key: KeyType; value: ValueType }[] = [
    { key: ['spt', s, p, t], value: o }, // used to store future values
    { key: ['st', s, t], value: true }, // what is the next update for a subject?
    { key: ['tsp', t, s, p], value: true },
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
    { key: ['sp', s, p], value: o }, // only one value can exist for s+p
    { key: ['ps', p, s], value: o },
    { key: ['sop', s, o, p], value: true },
    { key: ['ops', o, p, s], value: true },
    { key: ['osp', o, s, p], value: true },
    { key: ['pos', p, o, s], value: true },
  ];
  const ops =
    type === 'put'
      ? pairs.map(pair => ({ ...pair, type }))
      : pairs.map(({ key }) => ({ key, type }));
  return [...ops, ...operationsForDeferredTuple(tuple, type)];
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

export class Storage {
  constructor(private adapter: StorageAdapter) {}

  private async getCurrent(s: s, p: p, t: timestamp): Promise<StampedTuple[]> {
    return (await this.adapter.queryList<[string, s, p, timestamp], o>({
      gt: ['spt', s, p, ''],
      lte: ['spt', s, p, t],
    })).map(({ key: [, s, p, t], value: o }) => ({ s, p, o, t }));
  }

  // merge a tuple with the current db
  // returns a boolean which tells if the passed tuple is now the current tuple
  async merge(incomingTuple: StampedTuple): Promise<boolean> {
    const machineState = getCurrentState();
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
        operations = operationsForDeferredTuple(incomingTuple);
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
        operations = operationsForDeferredTuple(incomingTuple);
      }
    }

    if (operations.length > 0) {
      await this.adapter.batch(operations);
    }

    return merged;
  }

  // definitly stores a tuple
  async write(tuple: Tuple) {
    return this.merge({ ...tuple, t: getCurrentState() });
  }

  async writeRawSnapshot(obj: RawSnapshot): Promise<boolean> {
    const { id, ...other } = obj;

    // TODO this can be optimised as merge will be called lots of times, and merge will
    // lookup all combinations of s,p separately from the 'sp' database.
    // probably this function is not called very often
    console.info(
      'writeRawSnapshot is slow, please only write patches. Also note object values are not allowed'
    );

    const ops: Promise<boolean>[] = [];
    for (const [p, rawO] of Object.entries(other)) {
      if (isObjectOrFunction(rawO)) continue; // ignore object values
      const o = rawO as o;
      ops.push(this.write({ s: [id], p, o }));
    }

    const results = await Promise.all(ops);

    return results.reduce((res, subRes) => res || subRes, false) || false;
  }

  async getRawSnapshot(id: string): Promise<RawSnapshot> {
    const tuples = await this.adapter
      .queryList<[string, s, p], o>({
        gt: ['sp', [id], ''],
        lt: ['sp', [id], []],
      })
      .then(result =>
        result.map(({ key: [, s, p], value: o }) => ({ s, p, o } as Tuple))
      );

    const object: RawSnapshot = { id };

    for (const { p, o } of tuples) {
      object[p] = o;
    }

    return object;
  }

  //   async getRawInverse(id: string): Promise<RawInverse> {
  //     const tuples = await this.adapter
  //         .queryList<[string, o, p, s], true>({
  //           gt: ['ops', [id], ''],
  //           lt: ['ops', [id], []],
  //         })
  //         .then(result =>
  //           result.map(({ key: [, o, p, s] }) => ({ s, p, o } as Tuple))
  //         );

  //     const object: RawInverse = { id };

  //     for (const { p, s } of tuples) {
  //       const entry = object[p];
  //       if (Array.isArray(entry)) {
  //         entry.push(s[0]);
  //       } else {
  //         object[p] = s;
  //       }
  //     }

  //     return object;
  //   }
}
