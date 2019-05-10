import {
  reaction,
  runInAction,
  ObservableMap,
  isObservableMap,
  toJS,
} from 'mobx';
import { isEqual } from './index';
import {
  asMergeableObject,
  IMergeable,
  merge,
  ToMergeableObject,
  valueAt,
  pickAt,
} from './object-crdt';
import { state, subj, isObject } from './spo';
import { generateId } from './id';

/**
 * Class decorator, used to let TypeScript check required static properties
 */
export function staticImplements<T>() {
  return (constructor: StaticConstructors<T>) => constructor;
}

export abstract class Base {
  constructor(readonly identifier: string) {}

  static '@type' = 'Base';

  // for inheritance we need to define all args as any
  // maybe future TS will improve this.
  static create(idOrDataArg: any): any {
    const idOrData = idOrDataArg as string | Serialized<Base>;
    const id = typeof idOrData === 'string' ? idOrData : idOrData.identifier;
    const data = typeof idOrData === 'string' ? null : idOrData;

    if (data && '@type' in data && (data as any)['@type'] !== this['@type']) {
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

  static merge(instance: Base, data: Partial<Serialized<Base>>) {
    runInAction(() => {
      // make a mutable copy of data
      const incomingData: Partial<Serialized<Base>> = { ...data };

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
              incomingDatum as Record<string, Partial<Serialized<Base>>>
            )) {
              if (map.has(itemId)) {
                const currentItemValue = map.get(itemId)!;
                const currentItemCtor = currentItemValue.constructor as StaticConstructors<
                  any
                >;
                if (incomingItemDatum) {
                  currentItemCtor.merge(currentItemValue, incomingItemDatum);
                } else {
                  map.delete(itemId);
                  if (
                    isEqual(pathOf(currentItemValue), [
                      ...(pathOf(instance) || []),
                      prop,
                    ])
                  ) {
                    (currentItemValue.constructor as StaticConstructors<
                      any
                    >).destroy(currentItemValue);
                  }
                }
              } else if (incomingItemDatum) {
                // incomingItemDatum; // ?
                // ctor['@type']; // ?
                if (typeof incomingItemDatum.identifier === 'string') {
                  map.set(itemId, ctor.create(incomingItemDatum as any));
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

              currentCtor.merge.merge(currentValue, incomingDatum);
            } else {
              (instance as any)[prop] = null;

              if (
                isEqual(pathOf(currentValue), [
                  ...(pathOf(instance) || []),
                  prop,
                ])
              ) {
                (currentValue.constructor as StaticConstructors<any>).destroy(
                  currentValue
                );
              }
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
    [K in RefKeys<T>]:
      | null
      | subj
      | ((Required<T>[K]) extends ObservableMap<string, infer U>
          ? Record<string, subj | Serialized<U> | null>
          : Serialized<Required<T>[K]>)
      | (undefined extends T[K] ? undefined : never)
  };

type InstanceShape<T> = T & {
  readonly identifier: string;
};

export function many<T>(ctor: T): Record<string, T> {
  return new Proxy(Object.create(null), {
    get() {
      return ctor;
    },
  });
}

export type StaticConstructors<T> = {
  new (identifier: string): InstanceShape<T>;

  create: (data: Serialized<T> | string) => T;
  serialize: (source: T) => Omit<Serialized<T>, 'identifier'>;
  merge: (source: T, data: Partial<Serialized<T>>) => void;
  // destroy: (source: T) => void;

  '@type': string;
} & (RefKeys<T> extends never
  ? {}
  : {
      constructors: {
        [K in RefKeys<T>]: (Required<T>[K]) extends ObservableMap<
          string,
          infer U
        >
          ? StaticConstructors<U>
          : StaticConstructors<Required<T>[K]>
      };
    }) & { [key: string]: any };

type LookupInfoObject<T> = {
  objectType: 'object';
  object: T;
  owns: boolean;
  objectPath: subj;
};

type LookupInfoPrimitive<T> = {
  objectType: 'primitive';
  object: T;
};

type LookupInfo<T> = LookupInfoObject<T> | LookupInfoPrimitive<T>;

const lookupObject = <
  Subject extends object,
  Pred extends RequiredWritableKeysOf<Subject>
>(
  subject: Subject,
  pred: Pred
): LookupInfo<Subject[Pred]> => {
  const object = isObservableMap(subject) ? subject.get(pred) : subject[pred];
  const objectType = isObject(object) ? 'object' : 'primitive';

  if (objectType === 'primitive') return { object, objectType } as any;

  const subjectPath = pathOf(subject);
  if (subjectPath == null) throw new Error('subjectPath not set');

  const targetPath = [...subjectPath, pred] as string[];

  const objectPath =
    pathOf(object) || setPathOf((object as unknown) as object, targetPath);

  return {
    objectType,
    object,
    owns: isEqual(objectPath, targetPath),
    objectPath,
  } as any;
};

const pathSymbol = Symbol('path of object');
function pathOf(o: any): subj | undefined {
  // @ts-ignore
  return o[pathSymbol];
}
function setPathOf<O extends object>(o: O, subj: subj) {
  // @ts-ignore
  o[pathSymbol] = subj;
  return subj;
}

const asReferenceOrEmbedded = <
  Subject extends object,
  Pred extends RefKeys<Subject>
>(
  subject: Subject,
  pred: Pred
):
  | null
  | string[]
  | (undefined extends Subject[Pred]
      ? undefined | Serialized<Exclude<Subject[Pred], undefined>>
      : Serialized<Subject[Pred]>) => {
  const objectInfo = lookupObject(
    subject,
    (pred as unknown) as RequiredWritableKeysOf<Subject>
  );

  if (objectInfo.object == null) return null;

  if (objectInfo.objectType === 'primitive') {
    throw new Error('object must be an object');
  }

  const { owns, object, objectPath } = objectInfo;

  // check if this subject owns the object at pred.
  if (owns) {
    if (isObservableMap(object)) {
      const result = {} as any;
      for (const key of object.keys()) {
        result[key] = asReferenceOrEmbedded(object, key);
      }
      return result;
    }

    // embed the object
    const ctor = (object as any).constructor as StaticConstructors<
      typeof object
    >;
    return {
      '@type': ctor['@type'],
      identifier: (object as any).identifier,
      ...ctor.serialize(object),
    } as any;
  }

  // make a reference
  return objectPath;
};

export const serializeOne = <
  ParentObject,
  RefProp extends RefKeys<ParentObject>
>(
  object: ParentObject,
  prop: RefProp
): {
  [K in RefProp]:
    | null
    | string[]
    | (undefined extends ParentObject[RefProp]
        ? undefined | Serialized<Exclude<ParentObject[RefProp], undefined>>
        : Serialized<ParentObject[RefProp]>)
} => {
  // @ts-ignore
  return { [prop]: asReferenceOrEmbedded(object, prop) };
};

export const serializeMany = <
  ParentObject extends object,
  RefProp extends RefKeys<ParentObject>
>(
  object: ParentObject,
  prop: RefProp
): {
  [K in RefProp]:
    | null
    | string[]
    | Record<
        string,
        | null
        | string[]
        | ((ParentObject[RefProp]) extends ObservableMap<string, infer U>
            ? Serialized<U>
            : never)
      >
} => {
  const value = asReferenceOrEmbedded(object, prop);
  // @ts-ignore
  return { [prop]: value };
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

export const create = <T extends IMergeable>(
  getState: () => state,
  path: subj,
  ctor: StaticConstructors<T>,
  source: Record<string, MergableSerialized<T>>
) => {
  const current = valueAt(getState(), source) as Serialized<T>;

  let instance!: T;
  runInAction(() => {
    instance = ctor.create(current) as T;
  });

  setPathOf(instance, path);

  // manage live updates
  let mutexLocked = false;
  reaction(
    () => valueAt(getState(), source) as Partial<Serialized<T>>,
    current => {
      if (mutexLocked) return;

      // current; // ?

      try {
        mutexLocked = true;
        runInAction(() => ctor.merge(instance, current));
      } finally {
        mutexLocked = false;
      }
    },
    { fireImmediately: false }
  );

  reaction(
    () => ctor.serialize(instance),
    serialized => {
      if (mutexLocked) return;
      try {
        mutexLocked = true;

        const state = getState();

        function mergeSerialized(
          source: Record<string, ToMergeableObject<any>>,
          serialized: Omit<Serialized<any>, 'identifier'>
        ) {
          const current = valueAt(state, source);
          const currentSource = pickAt(state, source)!;

          for (const [key, incomingValue] of Object.entries(serialized)) {
            const currentValue = (current as any)[key];
            if (isObject(incomingValue) && isObject(currentValue)) {
              mergeSerialized(currentSource[key], incomingValue);
            } else if (!isEqual(incomingValue, currentValue)) {
              merge(currentSource, {
                [key]: asMergeableObject(state, incomingValue as any),
              } as any);
            }
          }
        }

        runInAction(() => mergeSerialized(source, serialized));
      } finally {
        mutexLocked = false;
      }
    },
    { fireImmediately: false }
  );

  return instance;
};
