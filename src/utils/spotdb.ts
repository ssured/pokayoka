import { openDB, IDBPDatabase } from 'idb';
import charwise from 'charwise';
import mlts from 'monotonic-lexicographic-timestamp';
import sha256 from './hash';

type primitive = boolean | string | number | null | undefined;
type subj = string[];
type pred = string;
type objt = primitive | subj;
type Tuple = [subj, pred, objt];
type state = string;
type GraphableObj = { [K in string]: primitive | GraphableObj };

type queryVariable = {
  '#': string;
  $: (val: subj | pred | objt) => subj | pred | objt;
};
type queryResult = {
  tuples: (Tuple)[];
  variables: { [key: string]: subj | pred | objt };
};
type query = {
  s?: subj | queryVariable | { gte: subj | []; lt: subj | [undefined] };
  p?: pred | queryVariable | { gte: pred | []; lt: pred | [undefined] };
  o?:
    | objt
    | queryVariable
    | { gte: objt | []; lt: objt | undefined | [undefined] };
  filter?: (tuple: Tuple) => boolean;
};

function objectFromTuple(
  [subj, pred, objt]: Tuple,
  tupleState: state,
  dbState: state
) {
  const enc = charwise.encode;
  return {
    hash: sha256(enc([subj, pred])),

    t: tupleState,
    db: dbState,

    // hex indexes
    spo: enc([subj, pred, objt]),
    pos: enc([pred, objt, subj]),
    pso: enc([pred, subj, objt]),
    ops: enc([objt, pred, subj]),
    osp: enc([objt, subj, pred]),
    sop: enc([subj, objt, pred]),
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
      upgrade: (db, oldVersion, newVersion, transaction) => {
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

  public async commit(data: Map<subj, GraphableObj | [GraphableObj, state]>) {
    const tx = (await this.db).transaction(this.objectStoreName, 'readwrite');

    for (const [subj, objOrObjWithState] of data.entries()) {
      let obj: GraphableObj;
      let state: state;
      if (Array.isArray(objOrObjWithState)) {
        [obj, state] = objOrObjWithState;
      } else {
        obj = objOrObjWithState;
        state = this.dbState();
      }
      for (const tuple of spoInObject(subj, obj)) {
        const object = objectFromTuple(tuple, state, this.dbState());
        tx.store.add(object);
      }
    }

    return tx.done;
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
    let lowerOpen = true;
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
          return (pos: [pred, objt, subj]) => [pos[2], pos[0], pos[1]] as Tuple;
        case 'pso':
          return (pso: [pred, subj, objt]) => [pso[1], pso[0], pso[2]] as Tuple;
        case 'ops':
          return (ops: [objt, pred, subj]) => [ops[2], ops[1], ops[0]] as Tuple;
        case 'osp':
          return (osp: [objt, subj, pred]) => [osp[1], osp[2], osp[0]] as Tuple;
        case 'sop':
          return (sop: [subj, objt, pred]) => [sop[0], sop[2], sop[1]] as Tuple;
      }
    })()!;

    let cursor = await (await this.db)
      .transaction(this.objectStoreName, 'readonly')
      .store.index(idx)
      .openKeyCursor(range, 'next');

    while (cursor) {
      yield keyToTuple(charwise.decode(cursor.key) as any);
      cursor = await cursor.continue();
    }
  }

  public variable = variable;

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

        if (isVariable(fS)) newResult.variables[fS['#']] = tuple[0];
        if (isVariable(fP)) newResult.variables[fP['#']] = tuple[1];
        if (isVariable(fO)) newResult.variables[fO['#']] = tuple[2];

        if (queries.length === 1) {
          yield newResult;
        } else {
          yield* this.query(queries.slice(1), newResult);
        }
      }
    }
  }
}

function isObject(x: unknown): x is object {
  return (typeof x === 'object' && x !== null) || typeof x === 'function';
}

function isObjt(v: unknown): v is objt {
  switch (typeof v) {
    case 'string':
    case 'boolean':
    case 'number':
      return true;
    case 'object':
      return v == null || isLink(v);
  }
  return false;
}

function isLink(x: unknown): x is subj {
  // TODO in production this check might be too expensive
  if (!Array.isArray(x) || x.length === 0) return false;
  for (let i = 0; i < x.length; i += 1) {
    if (typeof x[i] !== 'string') return false;
  }
  return true;
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

function* spoInObject(
  subj: subj,
  obj: GraphableObj,
  // weakmap to detect cycles
  paths: WeakMap<GraphableObj, subj> = new WeakMap()
): Iterable<Tuple> {
  if (paths.has(obj)) {
    throw new Error('this did not occur before, check implementation below');
    // console.log("frompaths", subj, obj, paths.get(obj));
    // if (subj.length === 0)
    //   throw new Error("impossible state, root references a known object");
    // yield {
    //   subj: subj.slice(0, -1),
    //   pred: subj.slice(-1)[0],
    //   objt: { "#": charwise.encode(paths.get(obj)) }
    // };
  } else {
    paths.set(obj, subj);
    for (const [key, value] of Object.entries(obj)) {
      if (isObjt(value)) {
        yield [subj, key, value];
      } else if (isObject(value)) {
        if (Array.isArray(value)) {
          throw new Error('arrays are not supported');
        }
        if (paths.has(value)) {
          yield [subj, key, paths.get(value)];
        } else {
          yield* spoInObject(subj.concat(key), value, paths);
          yield [subj, key, subj.concat(key)];
        }
      }
    }
  }
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
