import { primitive } from './spo';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// https://github.com/gcanti/typelevel-ts/blob/dd258332a4a151a19bc1fff892812d7a5d034dda/src/index.ts#L54
export type KeysOfType<A extends object, B> = {
  [K in keyof A]-?: A[K] extends B ? K : never
}[keyof A];

declare global {
  type Dictionary<T> = Record<string, T>;

  type UndefinedKeys<T> = {
    [P in keyof T]: undefined extends T[P] ? P : never
  }[keyof T];

  type func = (...args: any) => any;

  type Public<T> = { [P in keyof T]: T[P] };
  type Param0<Func> = Func extends (a: infer T, ...args: any[]) => any
    ? T
    : never;

  type MapFirstParameter<T extends Dictionary<func>> = {
    [K in keyof T]: Param0<T[K]>
  };

  type MapReturnType<T extends Dictionary<func>> = {
    [K in keyof T]: ReturnType<T[K]>
  };

  type UndefinedToOptional<T extends object> = {
    [K in Exclude<keyof T, UndefinedKeys<T>>]: T[K]
  } &
    { [K in UndefinedKeys<T>]?: T[K] };

  // https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
  type IfEquals<X, Y, A, B> = (<T>() => T extends X ? 1 : 2) extends (<
    T
  >() => T extends Y ? 1 : 2)
    ? A
    : B;

  // Alternatively:
  /*
  type IfEquals<X, Y, A, B> =
  [2] & [0, 1, X] extends [2] & [0, 1, Y] & [0, infer W, unknown]
  ? W extends 1 ? B : A
  : B;
  */

  type WritableKeysOf<T> = {
    [P in keyof T]: IfEquals<
      { [Q in P]: T[P] },
      { -readonly [Q in P]: T[P] },
      P,
      never
    >
  }[keyof T];
  type WritablePart<T> = Pick<T, WritableKeysOf<Required<T>>>;
  type ReadOnlyPart<T> = Omit<T, WritableKeysOf<Required<T>>>;

  type tFunction = (...args: any[]) => any;

  type ComputedKeys<T> = Exclude<keyof T, WritableKeysOf<Required<T>>>;
  type ActionKeys<T> = KeysOfType<Required<T>, tFunction> &
    WritableKeysOf<Required<T>>;

  type PrimitiveKeys<T> = KeysOfType<Required<T>, primitive> &
    WritableKeysOf<Required<T>>;
  type RefKeys<T> = Exclude<
    WritableKeysOf<Required<T>>,
    KeysOfType<Required<T>, primitive | tFunction | Set<any>>
  >;
  type SetKeys<T> = KeysOfType<Required<T>, Set<any>> &
    WritableKeysOf<Required<T>>;
}
