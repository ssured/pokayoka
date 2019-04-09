import { User } from '../model/User';
import { createObservable, UndefinedOrPartialSPO } from './spo-observable';
import { SPOHub } from './spo-hub';
import { SPOShape, primitive } from './spo';
import { Many, Dictionary } from '../model/base';

type Model = User;

const { root } = createObservable<{ user: { [key: string]: Model } }>(
  new SPOHub()
);

type MaybeUndefined<T> = T extends null | undefined ? undefined : never;

function getDeep<T, K1 extends keyof NonNullable<T>>(
  obj: T,
  k1: K1
): NonNullable<T>[K1] | MaybeUndefined<T>;
function getDeep<
  T,
  K1 extends keyof NonNullable<T>,
  K2 extends keyof NonNullable<NonNullable<T>[K1]>
>(
  obj: T,
  k1: K1,
  k2: K2
):
  | NonNullable<NonNullable<T>[K1]>[K2]
  | MaybeUndefined<T>
  | MaybeUndefined<NonNullable<T>[K1]>;
function getDeep<
  T,
  K1 extends keyof NonNullable<T>,
  K2 extends keyof NonNullable<NonNullable<T>[K1]>,
  K3 extends keyof NonNullable<NonNullable<NonNullable<T>[K1]>[K2]>
>(
  obj: T,
  k1: K1,
  k2: K2,
  k3: K3
):
  | NonNullable<NonNullable<NonNullable<T>[K1]>[K2]>[K3]
  | MaybeUndefined<T>
  | MaybeUndefined<NonNullable<T>[K1]>
  | MaybeUndefined<NonNullable<NonNullable<T>[K1]>[K2]>;
function getDeep(obj: any, ...keys: string[]): any {
  return keys.reduce(
    (result, key) => (result == null ? undefined : result[key]),
    obj
  );
}

type PartialSPO<T extends SPOShape> = {
  [K in keyof T]: T[K] extends primitive
    ? T[K]
    : T[K] extends SPOShape
    ? UndefinedOrPartialSPO<T[K]>
    : never
};

function isUser(obj: unknown): obj is User {
  return true;
}

function ok<U extends SPOShape, T extends UndefinedOrPartialSPO<U>>(
  obj: T,
  check: (obj: unknown) => obj is U
  // @ts-ignore: without the ignore typescript complains with: A type predicate's type must be assignable to its parameter's type.
): obj is PartialSPO<U> {
  return check(obj);
}

const user = root.user['sjoerd'];
if (user && ok(user, isUser)) {
  const { name } = user;
  const projectId = 'test';
  const project = user.projects[projectId];
}
const project = user!.projects['projectId'];
