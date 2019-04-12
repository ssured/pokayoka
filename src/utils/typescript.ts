export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// https://github.com/gcanti/typelevel-ts/blob/dd258332a4a151a19bc1fff892812d7a5d034dda/src/index.ts#L54
export type KeysOfType<A extends object, B> = {
  [K in keyof A]-?: A[K] extends B ? K : never
}[keyof A];
