import { IAnyModelType, Instance } from 'mobx-state-tree';
import { Result, Maybe } from 'true-myth';

// helper which always returns the same object from the provided thunk
// used to manage circular dependencies in the object model
export const singleton = <T>(thunk: () => T) => {
  let value: T;
  return () => value || (value = thunk());
};

export const nameFromType = (s: string) =>
  s.substr(0, 1).toUpperCase() + s.substr(1);

export interface Env {
  load<T extends IAnyModelType>(
    ModelThunk: () => T,
    identifier: string
  ): Result<Maybe<Instance<T>>, string>;
}
