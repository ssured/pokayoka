import {
  IObservableObject,
  observe,
  reaction,
  runInAction,
  autorun,
} from 'mobx';
import { IMergeable, merge, ToMergeableObject, valueAt } from './object-crdt';
import { state, subj } from './spo';
import { KeysOfType } from './typescript';

/* class decorator */
export function staticImplements<T>() {
  return (constructor: StaticConstructors<T>) => constructor;
}

export type Serialized<T> = Pick<T, PrimitiveKeys<T>>;

type InstanceShape<T> = T & {
  '@type': string;
  readonly path: string[];
  readonly serialized: Serialized<T>;
  merge(current: Partial<Serialized<T>>): void;
};

type StaticConstructors<T> = {
  new (path: subj): InstanceShape<T>;
  // connect: (subj: subj) => Promise<InstanceShape<T>>;
}; // & { [K in PrimitiveKeys<T>]: () => T[K] };

export const create = <T extends IMergeable>(
  getState: () => state,
  path: subj,
  ctor: StaticConstructors<T>,
  observableSource: ToMergeableObject<Serialized<T>> & IObservableObject
) => {
  const source = observableSource as ToMergeableObject<Serialized<T>>;

  const instance = new ctor(path);

  let mutexLocked = false;

  autorun(() => {
    const current = valueAt(getState(), source);

    if (mutexLocked) return;
    try {
      mutexLocked = true;
      runInAction(() => Object.assign(instance, current));
    } finally {
      mutexLocked = false;
    }
  });

  for (const key of Object.keys(instance.serialized) as PrimitiveKeys<T>[]) {
    if (key === '@type') continue;

    observe(instance, key as keyof T, change => {
      if (mutexLocked) return;
      try {
        mutexLocked = true;
        merge(source, {
          [key]: {
            [getState()]: change.newValue,
          },
        } as any);
      } finally {
        mutexLocked = false;
      }
    });
  }

  return instance;
};
