import dlv from 'dlv';

export type primitive = boolean | string | number | null | undefined;
export type subj = string[];
export type pred = string;
export type objt = primitive | subj;
export type state = string;
export type Tuple = [subj, pred, objt, state];
export type SPOShape = { [K in string]: primitive | SPOShape }; // links are hydrated
export type RawSPOShape = { [K in string]: objt | RawSPOShape }; // links are expressed as subj

const objToSubj = new WeakMap<RawSPOShape, subj>();

function subjsAreEqual(a: subj, b: subj) {
  if (a.length !== b.length) return false;
  return a.reduce((all, a, i) => all && a === b[i], false);
}

export function newRoot(): SPOShape {
  const newObject: SPOShape = {};
  objToSubj.set(newObject, []);
  return newObject;
}

function newObject(root: SPOShape, subj: subj): SPOShape {
  const parent = get(root, subj.slice(0, -1));
  parent[subj.slice(-1)[0]] = {};

  const newObject = get(root, subj); // trigger possible getters
  objToSubj.set(newObject, subj);

  return newObject;
}

export function getSubj(shape: SPOShape) {
  return objToSubj.get(shape);
}

export function get<P>(
  root: SPOShape,
  subj: subj,
  pred?: P
): P extends pred ? objt | SPOShape : SPOShape {
  let foundSubj = dlv<unknown>(root, subj);

  // if we encounter links, follow them with cycle checking
  const seen = new Set<unknown>([foundSubj]);
  while (isLink(foundSubj)) {
    if (subjsAreEqual(subj, foundSubj)) {
      // if you point to yourself you become empty
      return pred ? null : (newObject(root, subj) as any);
    }
    foundSubj = dlv<unknown>(root, foundSubj);
    if (seen.has(foundSubj)) {
      throw new Error('cycle in graph subjects');
    }
    seen.add(foundSubj);
  }

  if (typeof pred === 'string') {
    if (isSPOShape(foundSubj)) {
      const objt = foundSubj[pred] || null;
      if (isLink(objt)) return get(root, objt);
      return objt as any;
    }
    return null as any;
  }

  if (isSPOShape(foundSubj)) {
    return foundSubj as any;
  }

  return newObject(root, subj) as any;
}

export function set(
  root: SPOShape,
  subj: subj,
  pred: pred,
  objt: objt
): boolean {
  try {
    const parent = get(root, subj);

    if (objt == null) {
      delete parent[pred];
    }
    if (isLink(objt)) {
      parent[pred] = get(root, objt);
    } else {
      parent[pred] = objt;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function* spoInObject(
  subj: subj,
  obj: RawSPOShape,
  state: state
): Iterable<Tuple> {
  if (objToSubj.has(obj)) {
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
    objToSubj.set(obj, subj);
    for (const [key, value] of Object.entries(obj)) {
      if (isObjt(value)) {
        yield [subj, key, value, state];
      } else if (isObject(value)) {
        if (Array.isArray(value)) {
          throw new Error(
            `arrays are not supported ${JSON.stringify([subj, key, value])}`
          );
        }
        if (objToSubj.has(value)) {
          yield [subj, key, objToSubj.get(value)!, state];
        } else {
          yield* spoInObject(subj.concat(key), value, state);
          // yield [subj, key, subj.concat(key)];
        }
      }
    }
  }
}

export function isObject(x: unknown): x is object {
  return (typeof x === 'object' && x !== null) || typeof x === 'function';
}

export function isObjt(v: unknown): v is objt {
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

export function isLink(x: unknown): x is subj {
  // TODO in production this check might be too expensive
  if (!Array.isArray(x) || x.length === 0) return false;
  for (let i = 0; i < x.length; i += 1) {
    if (typeof x[i] !== 'string') return false;
  }
  return true;
}

export function isSPOShape(o: unknown, deep: boolean = false): o is SPOShape {
  return (
    isObject(o) &&
    !Array.isArray(o) &&
    (!deep ||
      Object.values(o).reduce(
        (all, value) => all && (isObjt(value) || isSPOShape(value)),
        true
      ))
  );
}
