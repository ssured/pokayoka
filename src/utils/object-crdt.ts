import { mergeWith } from 'lodash';
import { isObject } from './spo';

type objt = null | string | number | boolean | string[];

type MergeableShape<T extends object> = {
  [P in keyof T]?: T[P] extends object ? MergeableShape<T[P]> : objt
};
export interface IMergeable extends MergeableShape<object> {}

export type ToMergeableObject<T extends IMergeable> = {
  [K in keyof T]: Record<
    string,
    T[K] extends IMergeable ? ToMergeableObject<T[K]> : T[K]
  >
};

export type FromMergeableObject<
  T extends ToMergeableObject<IMergeable>
> = T extends ToMergeableObject<infer U> ? U : never;

type Value<T> = T[keyof T];

const isObjt = (v: unknown): v is objt => {
  if (v == null) return v === null;
  return typeof v !== 'object' || Array.isArray(v);
};

export function merge<T extends IMergeable>(
  object: ToMergeableObject<T>,
  ...sources: ToMergeableObject<T>[]
): ToMergeableObject<T> {
  return mergeWith(object, ...sources, (
    objValue: Value<ToMergeableObject<T>>,
    srcValue: Value<ToMergeableObject<T>>,
    key: string,
    object: ToMergeableObject<T>,
    source: ToMergeableObject<T>
    //   stack: unknown
  ) => {
    if (
      key in object &&
      key in source &&
      isObjt(objValue) &&
      isObjt(srcValue)
    ) {
      // resolve the conflict
      return (JSON.stringify(objValue) || '') > (JSON.stringify(srcValue) || '')
        ? objValue
        : srcValue;
    }
  });
}

const descending = (a: string, b: string) => (a < b ? 1 : -1);

/**
 *
 * @param state Which state should the value be wrapped with
 * @param value The value to wrap
 * @returns Object of the value at the state
 */
export function asMergeableObject<
  S extends string,
  T extends MergeableShape<any>
>(state: S, value: T): { [K in S]: ToMergeableObject<T> } {
  return {
    [state]: isObjt(value)
      ? value
      : Object.entries(value as MergeableShape<any>).reduce(
          (map, [key, value]) => {
            map[key] = asMergeableObject(state, value as any);
            return map;
          },
          {} as any
        ),
  } as any;
}

export function pickAt<T>(state: string, source: Record<string, T>): null | T {
  const states = Object.keys(source).sort(descending);
  const currentState = states.find(k => k <= state) || '';
  const currentValue = source[currentState];
  return currentValue == null ? null : currentValue;
}

export function valueAt<T extends IMergeable>(
  state: string,
  stateMap: Record<string, ToMergeableObject<T>>
): null | T {
  const currentValue = pickAt(state, stateMap);

  if (currentValue == null) return null;
  if (isObjt(currentValue)) return currentValue as any;

  return Object.entries(currentValue as Record<
    string,
    Record<string, unknown>
  >).reduce(
    (object, [key, innerStateMap]) => {
      object[key] = valueAt(state, innerStateMap as any);
      return object;
    },
    {} as any
  );
}
