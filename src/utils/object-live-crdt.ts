import {
  isObservableMap,
  ObservableMap,
  reaction,
  runInAction,
  toJS,
} from 'mobx';
import { isEqual } from './index';
import {
  asMergeableObject,
  IMergeable,
  merge,
  pickAt,
  ToMergeableObject,
  valueAt,
} from './object-crdt';
import { isObject, state, subj } from './spo';

/**
 * Class decorator, used to let TypeScript check required static properties
 */
export function checkDefinitionOf<T>() {
  return (constructor: StaticConstructors<T>) => constructor;
}

export abstract class UniversalObject {
  constructor(readonly identifier: string) {}

  // for inheritance we need to define all args as any
  // maybe future TS will improve this.
  static create(idOrDataArg: any): any {
    const idOrData = idOrDataArg as string | Serialized<UniversalObject>;
    const id = typeof idOrData === 'string' ? idOrData : idOrData.identifier;
    const data = typeof idOrData === 'string' ? null : idOrData;

    if (
      data &&
      '@type' in data &&
      (data as any)['@type'] !== (this as any)['@type']
    ) {
      throw new Error('create called on wrong @type');
    }

    const instance = new ((this as unknown) as (new (
      identifier: string
    ) => any))(id);

    if (data) {
      this.merge(instance, data as Partial<typeof data>);
    }
    return instance;
  }

  static merge(instanceArg: any, dataArg: any) {
    const instance = instanceArg as UniversalObject;
    const data = dataArg as Partial<Serialized<UniversalObject>>;

    runInAction(() => {
      // make a mutable copy of data
      const incomingData: Partial<Serialized<UniversalObject>> = { ...data };

      // remove not updateable properties
      delete (incomingData as any)['@type'];
      delete incomingData.identifier;

      // check all references
      for (const [prop, ctor] of Object.entries(((this as any).constructors ||
        {}) as Record<string, StaticConstructors<any>>)) {
        const incomingDatum = (incomingData as any)[prop] as any;
        delete (incomingData as any)[prop];

        const currentValue = (instance as any)[prop] as any;

        if (isObservableMap(currentValue)) {
          // it's a referene to a map
          const map = currentValue as ObservableMap<string, any>;

          if (incomingDatum == null) {
            map.clear();
          } else {
            if (typeof incomingDatum !== 'object') {
              throw new Error('incomingData must be an object');
            }

            for (const [itemId, incomingItemDatum] of Object.entries(
              incomingDatum as Record<
                string,
                Partial<Serialized<UniversalObject>>
              >
            )) {
              if (map.has(itemId)) {
                if (incomingItemDatum) {
                  const currentItemValue = map.get(itemId)!;
                  const currentItemCtor = currentItemValue.constructor as StaticConstructors<
                    any
                  >;
                  currentItemCtor.merge(currentItemValue, incomingItemDatum);
                } else {
                  map.delete(itemId);
                }
              } else if (incomingItemDatum) {
                // incomingItemDatum; // ?
                // ctor['@type']; // ?
                if (typeof incomingItemDatum.identifier === 'string') {
                  map.set(
                    itemId,
                    ctor.constructors[incomingItemDatum.identifier].create(
                      incomingItemDatum as any
                    )
                  );
                }
              }
            }
          }
        } else {
          // it's a reference to one object
          if (currentValue) {
            if (incomingDatum) {
              const currentCtor = currentValue.constructor as StaticConstructors<
                any
              >;

              currentCtor.merge(currentValue, incomingDatum);
            } else {
              (instance as any)[prop] = null;
            }
          } else if (incomingDatum) {
            if (typeof incomingDatum.identifier === 'string') {
              (instance as any)[prop] = ctor.create(incomingDatum);
            }
          }
        }
      }

      // assign remaining values, which should all be primitives
      // incomingData; // ?
      // toJS(instance); // ?
      Object.assign(instance, incomingData);
    });
  }

  // static serialize(source: Base): Omit<Serialized<Base>, 'identifier'> {
  //   throw new Error('must be implemented');
  // }
}

/**
 * Infer the serialized format from a mobx observable class
 */
export type Serialized<T> = { identifier: string } & Pick<T, PrimitiveKeys<T>> &
  {
    [K in RefKeys<T>]: ((Required<T>[K]) extends ObservableMap
      ? Record<string, string[]>
      : null | string[])
  };

type InstanceShape<T> = T & {
  readonly identifier: string;
};

export function many<T>(ctor: T): { constructors: Record<string, T> } {
  return {
    constructors: new Proxy(Object.create(null), {
      get() {
        return ctor;
      },
    }),
  };
}

export type StaticConstructors<T> = {
  new (identifier: string): InstanceShape<T>;

  create: (data: Serialized<T> | string) => T;
  serialize: (source: T) => Omit<Serialized<T>, 'identifier'>;
  merge: (source: T, data: Partial<Serialized<T>>) => void;

  '@type': string;
} & (RefKeys<T> extends never
  ? {}
  : {
      constructors: {
        [K in RefKeys<T>]: (Required<T>[K]) extends ObservableMap<
          string,
          infer U
        >
          ? { constructors: Record<string, StaticConstructors<U>> }
          : StaticConstructors<Required<T>[K]>
      };
    }) & { [key: string]: any };

export const serializeOne = <
  ParentObject,
  RefProp extends RefKeys<ParentObject>
>(
  object: ParentObject,
  prop: RefProp
): { [K in RefProp]: null | string[] } => {
  // @ts-ignore
  return { [prop]: object[prop] ? object[prop].identifier : null };
};

export const serializeMany = <
  ParentObject extends object,
  RefProp extends RefKeys<ParentObject>
>(
  object: ParentObject,
  prop: RefProp
): { [K in RefProp]: Record<string, string[]> } => {
  const result: any = {};

  for (const [key, value] of (object[prop] as any)
    ? (object[prop] as any).entries()
    : []) {
    // console.log(key)
    // console.log(toJS(value))
    result[prop] = result[prop] || {};
    result[prop][key] = [value.identifier];
  }

  // console.log(result);
  return result;
};

export type MergableSerialized<T extends IMergeable> = ToMergeableObject<
  { '@type'?: string; identifier: string } & Pick<T, PrimitiveKeys<T>> &
    {
      [K in RefKeys<T>]:
        | subj
        | MergableSerialized<Required<T>[K]>
        | (undefined extends T[K] ? undefined : never)
    }
>;

export function mergeSerialized(
  state: string,
  source: Record<string, ToMergeableObject<any>>,
  serialized: Omit<Serialized<any>, 'identifier'>
) {
  runInAction(() => {
    const current = valueAt(state, source) || {};
    const currentSource = pickAt(state, source)!;

    console.log(toJS(source));

    for (const [key, incomingValue] of Object.entries(serialized)) {
      const currentValue = (current as any)[key];
      if (isObject(incomingValue) && isObject(currentValue)) {
        mergeSerialized(state, currentSource[key], incomingValue);
      } else if (!isEqual(incomingValue, currentValue)) {
        merge(currentSource, {
          [key]: asMergeableObject(state, incomingValue as any),
        } as any);
      }
    }
  });
}

export const create = <T extends IMergeable>(
  getState: () => state,
  path: subj,
  Class: StaticConstructors<T>,
  source: Record<string, MergableSerialized<T>>
) => {
  const current = valueAt(getState(), source) as Serialized<T>;

  let instance!: T;
  runInAction(() => {
    instance = Class.create(current) as T;
  });

  // manage live updates
  let mutexLocked = false;
  reaction(
    () => valueAt(getState(), source) as Partial<Serialized<T>>,
    current => {
      if (mutexLocked) return;

      // current; // ?

      try {
        mutexLocked = true;
        Class.merge(instance, current);
      } finally {
        mutexLocked = false;
      }
    },
    { fireImmediately: false }
  );

  reaction(
    () => Class.serialize(instance),
    serialized => {
      if (mutexLocked) return;
      try {
        mutexLocked = true;
        mergeSerialized(getState(), source, serialized);
      } finally {
        mutexLocked = false;
      }
    },
    { fireImmediately: false }
  );

  return instance;
};
