import { reaction, runInAction, ObservableMap, isObservableMap } from 'mobx';
import { isEqual } from './index';
import {
  asMergeableObject,
  IMergeable,
  merge,
  ToMergeableObject,
  valueAt,
} from './object-crdt';
import { state, subj, isObject } from './spo';
import { generateId } from './id';

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

/**
 * Class decorator, used to let TypeScript check required static properties
 */
export function staticImplements<T>() {
  return (constructor: StaticConstructors<T>) => constructor;
}

type InstanceShape<T> = T & {
  readonly identifier: string;
};

export type StaticConstructors<T> = {
  new (identifier: string): InstanceShape<T>;

  create: (data: Serialized<T>) => T;
  serialize: (source: T) => Omit<Serialized<T>, 'identifier'>;
  merge: (source: T, data: Partial<Serialized<T>>) => void;
  destroy: (source: T) => void;

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
    });

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

export function defaultCreate<T>(
  this: StaticConstructors<T>,
  data: Serialized<T>
): T {
  if ('@type' in data && (data as any)['@type'] !== this['@type']) {
    throw new Error('create called on wrong @type');
  }
  const instance = new this(data.identifier || generateId());
  this.merge(instance, data as Partial<typeof data>);
  return instance;
}

export function defaultMerge<T>(
  this: StaticConstructors<T>,
  card: T,
  data: Partial<Serialized<T>>
) {
  runInAction(() => {
    // make a mutable copy of data
    const update: Partial<Serialized<T>> = { ...data };

    // remove not updateable properties
    delete (update as any)['@type'];
    delete update.identifier;

    // check all references
    for (const [prop, ctor] of Object.entries(((this as any).constructors ||
      {}) as Record<string, StaticConstructors<any>>)) {
      const incomingData = (data as any)[prop] as any;

      delete (update as any)[prop];

      const currentValue = (card as any)[prop] as any;

      if (isObservableMap(currentValue)) {
        // it's a referene to a map
        const map = currentValue as ObservableMap<string, any>;
        if (incomingData == null) {
          map.clear();
        } else {
          if (typeof incomingData !== 'object') {
            throw new Error('incomingData must be an object');
          }

          for (const [id, data] of Object.entries(incomingData as Record<
            string,
            Partial<Serialized<T>>
          >)) {
            if (map.has(id)) {
              const currentValue = map.get(id)!;
              if (data) {
                (currentValue.constructor as StaticConstructors<any>).merge(
                  currentValue,
                  data
                );
              } else {
                map.delete(id);
                if (
                  isEqual(pathOf(currentValue), [...(pathOf(card) || []), prop])
                ) {
                  (currentValue.constructor as StaticConstructors<any>).destroy(
                    currentValue
                  );
                }
              }
            } else if (data) {
              data; // ?
              if (typeof data.identifier === 'string') {
                map.set(id, ctor.create(data as any));
              }
            }
          }
        }
      } else {
        // it's a reference to one object
        if (currentValue) {
          if (incomingData) {
            (currentValue.constructor as StaticConstructors<any>).merge(
              currentValue,
              incomingData
            );
          } else {
            (card as any)[prop] = null;
            if (
              isEqual(pathOf(currentValue), [...(pathOf(card) || []), prop])
            ) {
              (currentValue.constructor as StaticConstructors<any>).destroy(
                currentValue
              );
            }
          }
        } else if (incomingData) {
          if (typeof incomingData.identifier === 'string') {
            (card as any)[prop] = ctor.create(incomingData);
          }
        }
      }
    }

    // assign remaining values, which should all be primitives
    Object.assign(card, update);
  });
}

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
  ParentObject,
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
  // TODO implement
  // @ts-ignore
  return { [prop]: asReferenceOrEmbedded(object, prop) };
};

export type MergableSerialized<T extends IMergeable> = ToMergeableObject<
  { identifier: string } & Pick<T, PrimitiveKeys<T>> &
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
  source: MergableSerialized<T>
) => {
  const current = valueAt(getState(), source) as Serialized<T>;

  const instance = ctor.create(current);
  setPathOf(instance, path);

  // manage live updates
  let mutexLocked = false;
  reaction(
    () => valueAt(getState(), source) as Partial<Serialized<T>>,
    current => {
      if (mutexLocked) return;

      current; // ?

      try {
        mutexLocked = true;
        runInAction(() =>
          (instance.constructor as typeof ctor).merge(instance, current)
        );
      } finally {
        mutexLocked = false;
      }
    },
    { fireImmediately: false }
  );

  reaction(
    () => (instance.constructor as typeof ctor).serialize(instance),
    serialized => {
      if (mutexLocked) return;
      // (serialized as any).identifier = instance.identifier;
      const state = getState();
      const current = valueAt(state, source);

      current; // ?
      serialized; // ?

      try {
        mutexLocked = true;
        const updates = {} as any;
        let doMerge = false;
        for (const [key, value] of Object.entries(serialized)) {
          if (value !== (current as any)[key]) {
            updates[key] = asMergeableObject(state, value as any);
            doMerge = true;
          }
        }
        if (doMerge) runInAction(() => merge(source, updates));
      } finally {
        mutexLocked = false;
      }
    },
    { fireImmediately: false }
  );

  return instance;
};
