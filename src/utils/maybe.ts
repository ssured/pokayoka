// simple runtime wrapper for unknown values
// just helps prevent unneccesary runtime undefined checking
// and makes you totally reliant on the Typescript typings.

export type Nothing = { [key: string]: Nothing };
export type Maybe<T> = T extends object
  ? { [K in keyof Required<T>]?: Maybe<Required<T>[K]> }
  : T | Nothing | undefined;

export const nothing: Nothing = new Proxy<Nothing>(
  {},
  {
    get(_, prop) {
      if (typeof prop === 'symbol') {
        if (prop === Symbol.toPrimitive) {
          return (hint: 'number' | 'string' | 'default') =>
            hint === 'number' ? 0 : '[object Nothing]';
        }
        // @ts-ignore
        return {}[prop];
      }
      if (prop === 'toString') {
        return () => '[object Nothing]';
      }
      if (prop === 'valueOf') {
        return () => {
          const obj = {};
          // @ts-ignore
          obj[Symbol.toStringTag] = 'Nothing';
          return obj;
        };
      }
      return nothing;
    },
  }
);

// @ts-ignore
export const isNothing = <T>(v: Maybe<T>): v is Nothing => v === nothing;

// @ts-ignore
export const isSomething = <T>(v: Maybe<T>): v is T | undefined =>
  v !== nothing;

export const m = <T>(v: Maybe<T>): T | undefined =>
  // @ts-ignore
  v === nothing ? undefined : v;
