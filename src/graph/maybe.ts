// simple runtime wrapper for unknown values
// just helps prevent unneccesary runtime undefined checking
// and makes you totally reliant on the Typescript typings.

type Nothing = { [key: string]: Nothing };
export type Maybe<T> = Nothing | T;
export const nothing: Nothing = new Proxy<Nothing>(
  {},
  {
    get(_, prop) {
      if (typeof prop === 'symbol') {
        if (prop === Symbol.toPrimitive) {
          return (hint: 'number' | 'string' | 'default') =>
            hint === 'number' ? 0 : '[object Unknown]';
        }
        // @ts-ignore
        return {}[prop];
      }
      if (prop === 'toString') {
        return () => '[object Unknown]';
      }
      if (prop === 'valueOf') {
        return () => {
          const obj = {};
          // @ts-ignore
          obj[Symbol.toStringTag] = 'Unknown';
          return obj;
        };
      }
      return nothing;
    },
  }
);
export const isNothing = (v: any): v is Nothing => v === nothing;
