import * as t from 'io-ts';
import { computed, observable, ObservableMap } from 'mobx';
import { primitive, SPOShape, subj } from '../../utils/spo';
import { nothing } from '../../utils/maybe';
import { ReactElement } from 'react';

type Dictionary<T> = Record<string, T>;
type Many<T extends SPOShape> = Dictionary<T>;
type One<T extends SPOShape> = T;

type InnerSerialized<T> = T extends primitive | undefined
  ? T
  : T extends Many<infer U>
  ? Dictionary<SPOShape>
  : T extends One<infer U>
  ? SPOShape
  : never;

export type Serialized<T extends SPOShape> = {
  [K in keyof T]: InnerSerialized<T[K]>
};

export const tGraphableObject: t.Type<SPOShape> = t.object as any;

export const tOne = tGraphableObject;
export const tMany = t.record(t.string, tGraphableObject);

export abstract class Model<T extends SPOShape> {
  constructor(protected serialized: Serialized<T>) {}
}

export type KeysOfType<A extends object, B> = {
  [K in keyof A]-?: A[K] extends B ? K : never
}[keyof A];

export type AsyncPropertiesOf<T extends SPOShape> = {
  [K in keyof T]: T[K] extends Many<infer U> | undefined
    ? undefined | ObservableMap<string, WrapAsync<U, any>>
    : T[K] extends Many<infer U>
    ? ObservableMap<string, WrapAsync<U, any>>
    : T[K] extends One<infer U> | undefined
    ? undefined | WrapAsync<U, any>
    : T[K] extends One<infer U>
    ? WrapAsync<U, any>
    : T[K] extends primitive | undefined
    ? T[K]
    : never
};

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type NonPrimitives<T extends SPOShape> = {
  [K in keyof Omit<T, KeysOfType<T, primitive>>]: T[K]
};

export type PartialObj<T> = T extends primitive | undefined
  ? T
  : T extends Many<infer U>
  ? { [K in keyof T]: PartialObj<T[K]> } | undefined
  : T extends One<infer U>
  ? Partial<{ [K in keyof T]: PartialObj<T[K]> }>
  : never;

export type Resolver = (subj: subj) => PartialObj<SPOShape>;

export class WrapAsync<T extends SPOShape, U> {
  @computed
  get decoded() {
    return this.ioType.decode(this.partial);
  }

  @computed
  get errors() {
    const getPaths = <A>(v: t.Validation<A>): string[] => {
      return v.fold(
        errors =>
          errors.map(error =>
            error.context.map(({ key }) => `${key}`).join('.')
          ),
        () => []
      );
    };

    const errors = getPaths(this.decoded);
    return errors.length === 0 ? null : errors;
  }

  // @computed
  // get serialized() {
  //   return this.ioType.is(this.partial)
  //     ? this.partial
  //     : Object.keys(this.partial) && undefined;
  //   // we use object.keys here to force mobx to recompute
  //   // TODO find out why IO-TS runtime checking does not work with mobx
  //   // when you comment out the above to: return /* Object.keys(this.partial) && */ undefined
  //   // mobx fails to recognize the validator
  // }

  @computed
  get value() {
    return this.errors == null
      ? new this.modelFactory(this.partial as any)
      : null;
  }

  @computed
  get maybe() {
    return this.value || nothing;
  }

  fold(
    ValueComponent: (value: U) => ReactElement<any> | null,
    PartialComponent: (shape: PartialObj<T>) => ReactElement<any> | null
  ): ReactElement<any> | null {
    if (this.value != null) {
      return ValueComponent(this.value);
    }
    return PartialComponent(this.partial as any);
  }

  constructor(
    public partial: SPOShape,
    private ioType: t.Type<Serialized<T>>,
    private modelFactory: new (serialized: Serialized<T>) => U
  ) {}
}

export function MapOf<T extends SPOShape, U>(
  wrapper: (obj: SPOShape) => WrapAsync<T, U>,
  recordOfSubj: Record<string, SPOShape>
): ObservableMap<string, WrapAsync<T, U>> {
  return observable.map(
    [...Object.entries(recordOfSubj)].map(
      ([key, obj]) => [key, wrapper(obj)] as [string, WrapAsync<T, U>]
    )
  );
}
