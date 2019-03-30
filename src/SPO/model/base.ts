import * as t from 'io-ts';
import { computed, ObservableSet, observable } from 'mobx';

type primitive = boolean | string | number | null | undefined;

export type subj = string[];
// type pred = string;
// type objt = primitive | subj;
// type Tuple = [subj, pred, objt];

export type GraphableObj = { [K in string]: primitive | GraphableObj };

type Dictionary<T> = Record<string, T>;
type Many<T extends GraphableObj> = Dictionary<T>;
type One<T extends GraphableObj> = T;

type InnerSerialized<T> = T extends primitive
  ? T
  : T extends Many<infer U>
  ? Dictionary<subj>
  : T extends One<infer U>
  ? subj
  : never;

export type Serialized<T extends GraphableObj> = {
  [K in keyof T]: InnerSerialized<T[K]>
};
export const tOne = t.array(t.string);
export const tMany = t.record(t.string, tOne);

export abstract class Model<T extends GraphableObj> {
  constructor(
    protected resolver: Resolver,
    protected serialized: Serialized<T>
  ) {}
}

export type KeysOfType<A extends object, B> = {
  [K in keyof A]-?: A[K] extends B ? K : never
}[keyof A];

export type AsyncPropertiesOf<T extends GraphableObj> = {
  [K in keyof T]: T[K] extends Many<infer U> | undefined
    ? undefined | ObservableSet<WrapAsync<U, any>>
    : T[K] extends Many<infer U>
    ? ObservableSet<WrapAsync<U, any>>
    : T[K] extends One<infer U> | undefined
    ? undefined | WrapAsync<U, any>
    : T[K] extends One<infer U>
    ? WrapAsync<U, any>
    : T[K] extends primitive
    ? T[K]
    : never
};

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type NonPrimitives<T extends GraphableObj> = {
  [K in keyof Omit<T, KeysOfType<T, primitive>>]: T[K]
};

export type PartialObj<T> = T extends primitive
  ? T
  : T extends Many<infer U>
  ? { [K in keyof T]: PartialObj<T[K]> } | undefined
  : T extends One<infer U>
  ? Partial<{ [K in keyof T]: PartialObj<T[K]> }>
  : never;

export type Resolver = (subj: subj) => PartialObj<GraphableObj>;

export class WrapAsync<T extends GraphableObj, U> {
  @computed
  get partial() {
    return this.resolver(this.subj);
  }

  @computed
  get serialized() {
    return this.validator(this.partial)
      ? this.partial
      : Object.keys(this.partial) && undefined;
    // we use object.keys here to force mobx to recompute
    // TODO find out why IO-TS runtime checking does not work with mobx
    // when you comment out the above to: return /* Object.keys(this.partial) && */ undefined
    // mobx fails to recognize the validator
  }

  @computed
  get value() {
    return (
      this.serialized && new this.modelFactory(this.resolver, this.serialized)
    );
  }

  constructor(
    private resolver: Resolver,
    public subj: subj,
    private validator: (data: unknown) => data is Serialized<T>,
    private modelFactory: new (
      resolver: Resolver,
      serialized: Serialized<T>
    ) => U
  ) {}
}

export function SetOf<T extends GraphableObj, U>(
  wrapper: (resolver: Resolver, subj: subj) => WrapAsync<T, U>,
  resolver: Resolver,
  recordOfSubj: Record<string, subj>
) {
  return observable.set(
    [...Object.values(recordOfSubj)]
      .map(subj => JSON.stringify(subj)) // map to string
      .filter((value, i, a) => a.indexOf(value) === i) // filter unique
      .map(jsonSubj => wrapper(resolver, JSON.parse(jsonSubj)))
  );
}
