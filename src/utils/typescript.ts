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
}
