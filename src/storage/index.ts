import mlts from 'monotonic-lexicographic-timestamp';
import SubscribableEvent from 'subscribableevent';
import { JsonPrimitive, JsonEntry } from '../utils/json';
import {
  BatchOperations,
  StorageAdapter,
  BatchOperation,
} from './adapters/shared';
import { ham } from './ham';
import { hash } from './hash';
import { CharwiseKey } from 'charwise';

import { IterableQueue } from './iterable-queue';

export type timestamp = string;
export type subj = string[];
export type pred = string;
export type objt = JsonPrimitive | ([string] & string[]);
type indexes = 'spo' | 'sop' | 'pso' | 'pos' | 'ops' | 'osp' | 'spt' | 'log';
export interface Tuple {
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

export interface StampedTuple extends Tuple {
  t: timestamp;
}

export class Transaction
  implements
    PromiseLike<CommitResult>,
    Iterable<StampedTuple>,
    AsyncIterable<BatchOperation> {
  private defer = defer<CommitResult>();
  public then = this.defer.promise.then.bind(this.defer.promise);
  public tuples: StampedTuple[];

  protected didCommit = false;

  // tslint:disable-next-line function-name
  public *[Symbol.iterator]() {
    yield* this.tuples;
  }

  // tslint:disable-next-line function-name
  public async *[Symbol.asyncIterator]() {
    const machineState = this.storage.getMachineState();
    for (const tuple of this.tuples) {
      yield* await this.storage.mergeTuple(tuple, machineState);
    }
  }

  constructor(
    private storage: Storage,
    tuples: Iterable<StampedTuple>,
    public addedAt: timestamp
  ) {
    this.tuples = [...tuples];
  }

  registerCommit(commit: PromiseLike<CommitResult>) {
    this.defer.resolve(commit);
  }

  commitImmediately() {
    if (this.didCommit) return this as PromiseLike<CommitResult>;
    this.didCommit = true;
    return this.storage.commit([this]);
  }
}

class Commit implements PromiseLike<CommitResult> {
  private defer = defer<CommitResult>();
  public then = this.defer.promise.then.bind(this.defer.promise);
  private transactions: Transaction[] = [];

  constructor(
    private adapter: StorageAdapter,
    transactions: Iterable<Transaction>
  ) {
    for (const transaction of transactions) {
      transaction.registerCommit(this);
      this.transactions.push(transaction);
    }

    this.processCommit();
  }

  protected async processCommit() {
    const operations: BatchOperations = [];
    for await (const operation of combineAsyncIterables(...this.transactions)) {
      operations.push(operation);
    }

    try {
      await this.adapter.batch(operations);
      this.defer.resolve({
        ok: true,
        transactions: this.transactions,
      });
    } catch (e) {
      this.defer.reject(e);
    }
  }
}

type CommitResult = {
  ok: boolean;
  transactions: Iterable<Transaction>;
};

export type TransactionResult = Promise<CommitResult> & {
  commitImmediately(): Promise<CommitResult>;
};

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
  constructor(
    protected adapter: StorageAdapter,
    public getMachineState = numberToState()
  ) {}

  /**
   * Unique id of this storage
   */

  protected id: string | null = null;
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

  /**
   * expose an event for each written tuple
   */
  protected committedTransactions = new SubscribableEvent<
    (transactions: Iterable<Transaction>) => void
  >();

  /**
   * Get the last known timestamp for a remote storage
   * enhances sync
   * @param storageId Id of the remote storage instance
   */
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

  /**
   * Save the latest known timestamp for later usage
   * @param storageId Id of the remote storage instance
   * @param timestamp Latest known timestamp to save
   */
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

  /**
   * Returns an async iterator of [timestamp, tuple] tuples
   * @param timestamp Get all tuples which were written since this timestamp. This is not the timestamp of the tuple!
   * @param options `skipFirst: boolean` skip the first timestamp.
   */
  protected async *tuplesSince(
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

  /**
   * Return all current tuples
   */
  protected async getCurrent(
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
  public async mergeTuple(
    incomingTuple: StampedTuple,
    machineState = this.getMachineState()
  ): Promise<Iterable<BatchOperation>> {
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

    return operations;
  }

  private transactionQueue = new IterableQueue<Transaction>();

  protected enqueueTuples(
    tuples: Iterable<StampedTuple>,
    machineState = this.getMachineState()
  ) {
    const transaction = new Transaction(this, tuples, machineState);
    this.transactionQueue.add(transaction);
    return transaction;
  }

  /**
   * Commit ops to DB, returns a promise when the commit is done
   */
  public async commit(
    specificTransactions?: Iterable<Transaction>
  ): Promise<CommitResult> {
    const transactions = specificTransactions || this.transactionQueue;
    const commit = new Commit(this.adapter, transactions);

    commit.then(result => {
      this.committedTransactions.fire(result.transactions);
    });

    return commit;
  }

  private async *singleQuery<T extends indexes>(
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

  public async *query(
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

    for await (const tuple of this.singleQuery.apply(this, args)) {
      if (filter == null || filter(tuple)) {
        const newResult = clone(result);
        newResult.tuples.push(tuple);

        if (isVariable(fS)) newResult.variables[fS['#']] = tuple.s;
        if (isVariable(fP)) newResult.variables[fP['#']] = tuple.p;
        if (isVariable(fO)) newResult.variables[fO['#']] = tuple.o;

        if (queries.length === 1) {
          yield newResult;
        } else {
          yield* this.query(queries.slice(1), newResult);
        }
      }
    }
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

interface DeferredPromise<T> {
  promise: Promise<T>;
  resolve: T extends void ? () => void : (value: T | PromiseLike<T>) => void;
  reject: (error: Error) => void;
}
function defer<T = void>(): DeferredPromise<T> {
  const deferred: any = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}

function* combineIterables<T>(...iterables: Iterable<T>[]): Iterable<T> {
  for (const iterable of iterables) {
    yield* iterable;
  }
}
async function* combineAsyncIterables<T>(
  ...iterables: AsyncIterable<T>[]
): AsyncIterable<T> {
  for (const iterable of iterables) {
    yield* iterable;
  }
}
