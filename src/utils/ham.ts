import * as t from 'io-ts';

export const State = t.refinement(t.number, s => s > 0, 'State');
export type State = t.TypeOf<typeof State>;
export const currentState = (): State => Date.now();

export const StringTuple = t.tuple([State, t.string]);
export type StringTuple = t.TypeOf<typeof StringTuple>;
export const NumberTuple = t.tuple([State, t.number]);
export type NumberTuple = t.TypeOf<typeof NumberTuple>;
export const BooleanTuple = t.tuple([State, t.boolean]);
export type BooleanTuple = t.TypeOf<typeof BooleanTuple>;
export const NullTuple = t.tuple([State, t.null]);
export type NullTuple = t.TypeOf<typeof NullTuple>;

export const ValueTuple = t.union(
  [StringTuple, NumberTuple, BooleanTuple, NullTuple],
  'Value'
);
export type ValueTuple = t.TypeOf<typeof ValueTuple>;

export const LinkTuple = t.tuple([State, t.null, t.string], 'Link');
export type LinkTuple = t.TypeOf<typeof LinkTuple>;

export const Tuple = t.union([ValueTuple, LinkTuple]);
export type Tuple = t.TypeOf<typeof Tuple>;

export type Tuplify<T> = T extends string
  ? StringTuple
  : T extends number
  ? NumberTuple
  : T extends boolean
  ? BooleanTuple
  : T extends null
  ? NullTuple
  : T extends link
  ? LinkTuple
  : never;

// const CollectionTuple = t.tuple([State, t.null, t.null, t.string], 'Collection');
// type CollectionTuple = t.TypeOf<typeof CollectionTuple>;
// export const Node = t.refinement(
//   t.dictionary(
//     t.string,
//     t.union([t.string, Tuple /*, CollectionTuple*/]),
//     'Node'
//   ),
//   n => {
//     if (typeof n.type !== 'string') return false;
//     for (const [key, value] of Object.entries(n)) {
//       if (key !== 'type' && !Tuple.is(value)) return false;
//     }
//     return true;
//   }
// );
// export type Node = t.TypeOf<typeof Node>;

export const isBoolean = (x: unknown): x is boolean => typeof x === 'boolean';
export const isString = (x: unknown): x is string => typeof x === 'string';
export const isNumber = (x: unknown): x is number => typeof x === 'number';
export const isNull = (x: unknown): x is null => x === null;

export type primitive = null | boolean | string | number;
export const isPrimitive = (x: unknown): x is primitive =>
  isNull(x) || isBoolean(x) || isString(x) || isNumber(x);

export const isObject = (x: any): x is object =>
  (typeof x === 'object' && x !== null) || typeof x === 'function';

export type link = { _: string };
export const isLink = (x: unknown): x is link =>
  isObject(x) && '_' in x && typeof (x as any)['_'] === 'string';

export type value = primitive | link;

export const toValue = (t: Tuple): primitive | link => {
  if (!Tuple.is(t)) throw new Error('toValue: t is not a tuple');
  return t[t.length - 1];
};

export const toState = (t: Tuple): State => {
  if (!Tuple.is(t)) throw new Error('toState: t is not a tuple');
  return t[0];
};

export const toTuple = (a: primitive | link, state = currentState()): Tuple => {
  if (isString(a)) return [state, a];
  if (isNull(a)) return [state, a];
  if (isNumber(a)) return [state, a];
  if (isBoolean(a)) return [state, a];

  if (isLink(a)) return [state, null, a['_']];

  throw new Error(`toTuple: cannot wrap ${a}`);
};

/* Based on the Hypothetical Amnesia Machine thought experiment */
// tslint:disable-next-line
export function HAM(
  machineState: State,
  incoming: Tuple,
  current: Tuple
):
  | { type: 'defer' }
  | { type: 'historical' }
  | { type: 'converge'; current: boolean }
  | { type: 'equal' } {
  const incomingState = incoming[0];
  const currentState = current[0];

  if (machineState < incomingState) {
    return { type: 'defer' }; // the incoming value is outside the boundary of the machine's state, it must be reprocessed in another state.
  }
  if (incomingState < currentState) {
    return { type: 'historical' }; // the incoming value is within the boundary of the machine's state, but not within the range.
  }
  if (currentState < incomingState) {
    return { type: 'converge', current: false }; // the incoming value is within both the boundary and the range of the machine's state.
  }
  if (incomingState === currentState) {
    const incomingValue = JSON.stringify(toValue(incoming)) || '';
    const currentValue = JSON.stringify(toValue(current)) || '';
    return incomingValue === currentValue
      ? { type: 'equal' }
      : { type: 'converge', current: incomingValue < currentValue };
  }
  throw new Error(
    `Invalid CRDT Data: ${toValue(incoming)} to ${toValue(
      current
    )} at ${incomingState} to ${currentState}!`
  );
}

export type HAMObject = { [key: string]: Tuple };
export const isHAMObject = (obj: object): obj is HAMObject => {
  for (const value of Object.values(obj)) {
    if (!Tuple.is(value)) return false;
  }
  return true;
};

// https://dev.to/miracleblue/how-2-typescript-get-the-last-item-type-from-a-tuple-of-types-3fh3
// Borrowed from SimplyTyped:
// prettier-ignore
type Prev<T extends number> = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62][T];

// Actual, legit sorcery
// Borrowed from pelotom/hkts:
type GetLength<original extends any[]> = original extends { length: infer L }
  ? L
  : never;
type GetLast<original extends any[]> = original[Prev<GetLength<original>>];

type UnTuple<T extends Tuple> = GetLast<T>;
type UnHam<T extends HAMObject> = {
  [K in keyof T]: T[K] | (T[K] extends Tuple ? UnTuple<T[K]> : never)
};

const hamHandler = {
  get(thing: HAMObject, prop: string | number | symbol) {
    if (typeof prop !== 'string') return Reflect.get(thing, prop);
    const possibleTuple = Reflect.get(thing, prop);
    const value = Tuple.is(possibleTuple) ? toValue(possibleTuple) : undefined;
    //   onGet.fire(thing, prop);
    return value;
  },
  set(thing: HAMObject, prop: string | number | symbol, incoming: any) {
    if (typeof prop !== 'string') return Reflect.set(thing, prop, incoming);
    try {
      let tuple;
      if (Tuple.is(incoming)) {
        // it is a merge
        const machine = currentState();
        const current = Reflect.get(thing, prop);
        const converge = HAM(machine, incoming, current);
        switch (converge.type) {
          case 'equal': // incoming is same as current
          case 'historical': // old information
            return true;
          case 'defer': // future info, postpone
            setTimeout(() => (thing[prop] = incoming), incoming[0] - machine);
            return true;
          case 'converge':
            if (converge.current) return true; // current wins
            tuple = incoming; // incoming wins
        }
      } else {
        tuple = toTuple(incoming);
      }
      //   onSet.fire(thing, prop, tuple);
      return Reflect.set(thing, prop, tuple);
    } catch (e) {
      return false;
    }
  },
};

export const createHAMProxy = <T extends HAMObject>(source: T): UnHam<T> => {
  if (!isHAMObject(source)) {
    throw new Error('Non ham object passed to proxy creator');
  }
  return (new Proxy(source, hamHandler) as unknown) as UnHam<T>;
};
