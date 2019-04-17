import { openDB, IDBPDatabase } from 'idb';
import charwise from 'charwise';
import mlts from 'monotonic-lexicographic-timestamp';
import sha256 from './hash';
import SubscribableEvent from 'subscribableevent';

import { subj, pred, objt, state, Tuple } from './spo';

type queryVariable = {
  '#': string;
  $: (val: subj | pred | objt) => subj | pred | objt;
};
type queryResult = {
  tuples: (Tuple)[];
  variables: { [key: string]: subj | pred | objt };
};
type query = {
  s?:
    | subj
    | queryVariable
    | { gte: subj | []; lt: subj | (string | undefined)[] };
  p?: pred | queryVariable | { gte: pred | []; lt: pred | [undefined] };
  o?:
    | objt
    | queryVariable
    | { gte: objt | []; lt: objt | undefined | [undefined] };
  filter?: (tuple: Tuple) => boolean;
};

function objectFromTuple([subj, pred, objt, state]: Tuple, dbState: state) {
  const enc = charwise.encode;
  return {
    hash: sha256(enc([subj, pred])),
    db: dbState,

    // hex indexes
    spo: enc([subj, pred, objt, state]),
    pos: enc([pred, objt, subj, state]),
    pso: enc([pred, subj, objt, state]),
    ops: enc([objt, pred, subj, state]),
    osp: enc([objt, subj, pred, state]),
    sop: enc([subj, objt, pred, state]),
  };
}

export class SpotDB {
  private objectStoreName: 'hexastore' = 'hexastore';

  protected db: Promise<
    IDBPDatabase<{
      hexastore: {
        key: string;
        value: ReturnType<typeof objectFromTuple>;
        indexes: {
          spo: 'spo';
          pos: 'pos';
          pso: 'pso';
          ops: 'ops';
          osp: 'osp';
          sop: 'sop';
          db: 'db';
        };
      };
    }>
  >;

  constructor(
    public readonly name: string,
    public readonly dbState: () => string = mlts()
  ) {
    this.db = openDB(name, 10, {
      upgrade: (db /*, oldVersion, newVersion, transaction*/) => {
        if ((db.objectStoreNames as any).contains(this.objectStoreName)) {
          db.deleteObjectStore(this.objectStoreName);
        }
        const store = db.createObjectStore(this.objectStoreName, {
          keyPath: 'hash',
        });
        // get the data
        store.createIndex('spo', 'spo', { unique: true });
        // search records of a certain type in a subset of the DB ['type','project',['1234']]
        store.createIndex('pos', 'pos', { unique: true });
        // search data of a specific property in a subset of the DB
        store.createIndex('pso', 'pso', { unique: true });
        // what relates to a certain subject? (reverse lookup)
        store.createIndex('ops', 'ops', { unique: true });
        // in a subset of the db I search for a certain value to exist
        store.createIndex('osp', 'osp', { unique: true });
        // no known usage yet
        store.createIndex('sop', 'sop', { unique: true });

        // what is written when in this database
        store.createIndex('db', 'db', { unique: true });
      },
      // blocked() {},
      // blocking() {}
    });
  }

  public readonly committedTuples = new SubscribableEvent<
    (tuples: Tuple[]) => void
  >();

  public async commit(tuples: Tuple[]) {
    const tx = (await this.db).transaction(this.objectStoreName, 'readwrite');

    for (const tuple of tuples) {
      const object = objectFromTuple(tuple, this.dbState());
      tx.store.put(object);
    }

    await tx.done;

    // expose all written tuples to live listeners
    this.committedTuples.fire(tuples);

    // console.log('committed', tuples);

    return;
  }

  public async get(subj: subj, pred: pred): Promise<Tuple | undefined> {
    try {
      const record = await (await this.db).get(
        'hexastore',
        sha256(charwise.encode([subj, pred]))
      );
      const tuple = record && (charwise.decode(record.spo) as Tuple);
      return tuple;
    } catch (e) {
      console.error('error spotdb get', subj, pred, e);
    }
  }

  private async *singleQuery<
    T extends 'spo' | 'sop' | 'pso' | 'pos' | 'ops' | 'osp'
  >(
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
    const lower: (subj | pred | objt)[] = [];
    const upper: (subj | pred | objt | undefined)[] = [];
    const lowerOpen = true;
    let upperOpen = true;

    if (typeof p1 !== 'undefined') {
      // @ts-ignore
      lower.push(isRange(p1) ? p1.gte : p1);
      // @ts-ignore
      upper.push(isRange(p1) ? p1.lt : p1);
    }
    if (typeof p2 !== 'undefined') {
      // @ts-ignore
      lower.push(isRange(p2) ? p2.gte : p2);
      // @ts-ignore
      upper.push(isRange(p2) ? p2.lt : p2);
    }
    if (typeof p3 !== 'undefined') {
      // @ts-ignore
      lower.push(isRange(p3) ? p3.gte : p3);
      // @ts-ignore
      upper.push(isRange(p3) ? p3.lt : p3);
      upperOpen = false;
    } else {
      lower.push(null);
      upper.push(undefined);
    }

    const range = IDBKeyRange.bound(
      charwise.encode(lower),
      charwise.encode(upper),
      lowerOpen,
      upperOpen
    );

    const keyToTuple = (() => {
      switch (idx) {
        case 'spo':
          return (i: string[]) => i as Tuple;
        case 'pos':
          return (pos: [pred, objt, subj, state]) =>
            [pos[2], pos[0], pos[1], pos[3]] as Tuple;
        case 'pso':
          return (pso: [pred, subj, objt, state]) =>
            [pso[1], pso[0], pso[2], pso[3]] as Tuple;
        case 'ops':
          return (ops: [objt, pred, subj, state]) =>
            [ops[2], ops[1], ops[0], ops[3]] as Tuple;
        case 'osp':
          return (osp: [objt, subj, pred, state]) =>
            [osp[1], osp[2], osp[0], osp[3]] as Tuple;
        case 'sop':
          return (sop: [subj, objt, pred, state]) =>
            [sop[0], sop[2], sop[1], sop[3]] as Tuple;
      }
    })()!;

    let cursor = await (await this.db)
      .transaction(this.objectStoreName, 'readonly')
      .store.index(idx)
      .openKeyCursor(range, 'next');

    // collect all results at once
    // we cannot yield when the cursor is open as it stops the current runloop
    // and thus closes the connection
    // future implementation might batch and then continue using a new cursor
    const results: Tuple[] = [];
    while (cursor) {
      results.push(keyToTuple(charwise.decode(cursor.key) as any));
      cursor = await cursor.continue();
    }

    yield* results;
  }

  public query(queries: (v: typeof variable) => query[]) {
    return this._query(queries(variable));
  }

  public async *_query(
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

        if (isVariable(fS)) newResult.variables[fS['#']] = tuple[0];
        if (isVariable(fP)) newResult.variables[fP['#']] = tuple[1];
        if (isVariable(fO)) newResult.variables[fO['#']] = tuple[2];

        if (queries.length === 1) {
          yield newResult;
        } else {
          yield* this._query(queries.slice(1), newResult);
        }
      }
    }
  }
}

function isVariable(arg: any): arg is queryVariable {
  return arg != null && typeof arg === 'object' && '#' in arg && '$' in arg;
}

function variable(
  name: string = '',
  mapper: queryVariable['$'] = (i: any) => i
): queryVariable {
  return { '#': name, $: mapper };
}

function clone<T extends any>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function isRange(
  obj: unknown
): obj is {
  gte: subj | pred | objt;
  lt: subj | pred | objt;
} {
  return (
    typeof obj === 'object' &&
    obj != null &&
    Object.keys(obj).length === 2 &&
    'gte' in obj &&
    'lt' in obj
  );
}

// (async function doDatabaseStuff() {
//   const db = new SpotDB("test");
//   const objects = new Map<subj, GraphableObj>();

//   //   const faker = require('faker');
//   //   for (let i = 0; i < 10000; i += 1) {
//   //     const id = Math.random()
//   //       .toString(36)
//   //       .substr(2);

//   //     const object = {
//   //       name: faker.name.findName(),
//   //       email: faker.internet.email(),
//   //       jobtitle: faker.name.jobTitle()
//   //     };

//   //     objects.set([id], object);
//   //   }

//   console.time("insert");
//   await db.commit(objects);
//   console.timeEnd("insert");

//   // @ts-ignore
//   window.db = db;
//   // @ts-ignore
//   window.variable = variable;
// })();

/**
 * (async function() { let results=[]; console.time('query'); for await (const data of db.query([{s:variable('s'),p:'email',o:{gte: 'Z', lt:[]}}])) { console.log({data}); results.push(data); } console.timeEnd('query'); console.log({results, count: results.length}); })()
 */
