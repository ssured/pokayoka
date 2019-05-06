import { mergeWith } from 'lodash';

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

export function valueAt<T extends IMergeable>(
  state: string,
  object: ToMergeableObject<T>
): T {
  return Object.entries(object).reduce(
    (object, [key, stateMap]) => {
      if (isObjt(stateMap)) {
        object[key] = stateMap;
      } else {
        const states = Object.keys(stateMap).sort(descending);
        const currentState = states.find(k => k <= state) || '';
        object[key] = stateMap[currentState] || null;
      }
      return object;
    },
    {} as any
  );
}
