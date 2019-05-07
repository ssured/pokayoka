import { reaction, runInAction } from 'mobx';
import { isEqual } from './index';
import {
  asMergeableObject,
  IMergeable,
  merge,
  ToMergeableObject,
  valueAt,
} from './object-crdt';
import { state, subj } from './spo';
import { generateId } from './id';

/* class decorator */
export function staticImplements<T>() {
  return (constructor: StaticConstructors<T>) => constructor;
}

export type Serialized<T> = { identifier: string } & Pick<T, PrimitiveKeys<T>> &
  {
    [K in RefKeys<T>]:
      | subj
      | Serialized<Required<T>[K]>
      | (undefined extends T[K] ? undefined : never)
  };

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
      constructors: { [K in RefKeys<T>]: StaticConstructors<Required<T>[K]> };
    });

export function defaultCreate<T>(
  this: StaticConstructors<T>,
  data: Serialized<T>
): T {
  const instance = new this(data.identifier || generateId());
  this.merge(instance, data as Partial<typeof data>);
  return instance;
}

const pathSymbol = Symbol('path of object');
export function pathOf(o: any): subj | undefined {
  // @ts-ignore
  return o[pathSymbol];
}
export function setPathOf<O extends object>(o: O, subj: subj) {
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
  | string[]
  | (undefined extends Subject[Pred]
      ? undefined | Serialized<Exclude<Subject[Pred], undefined>>
      : Serialized<Subject[Pred]>) => {
  const object = subject[pred];

  // @ts-ignore => TS does not understand the conditional in the return type above
  if (object == null) return object;
  if (typeof object !== 'object') throw new Error('object must be an object');

  const subjectPath = pathOf(subject);
  if (subjectPath == null) throw new Error('subjectPath not set');

  const targetPath = [...subjectPath, pred] as string[];

  const objectPath =
    pathOf(object) || setPathOf((object as unknown) as object, targetPath);

  if (isEqual(objectPath, targetPath)) {
    // embed the object
    const ctor = (object as any).constructor as StaticConstructors<
      typeof object
    >;
    // @ts-ignore
    return ctor.serialize(object);
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
    | string[]
    | (undefined extends ParentObject[RefProp]
        ? undefined | Serialized<Exclude<ParentObject[RefProp], undefined>>
        : Serialized<ParentObject[RefProp]>)
} => {
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
