// export const createPathProxy: <T extends { [key: string]: any }>(
//   mapper?: (
//     path: string[],
//     key: keyof T
//   ) => T extends { [key: string]: infer U }
//     ? U extends (...args: any[]) => any
//       ? ReturnType<U>
//       : never
//     : never
// ) => T;s
export const anyProp: symbol;

type defaultProxyType<T = string[]> = {
  (path: string[]): T;
  [key: string]: defaultProxyType<T>;
};

type unwrap<T extends (path: string[]) => any> = (T extends (
  ...args: any[]
) => any
  ? {
      (): ReturnType<T>;
    }
  : { (): string[] }) &
  (T extends { [key: string]: (path: string[]) => any }
    ? { [P in keyof T]: unwrap<T[P]> }
    : {
        [P in keyof defaultProxyType]: unwrap<
          (path: string[]) => defaultProxyType[P]
        >
      });
//      &
//   (T extends { anyProp: any }
//     ? never
//     : { [P in keyof defaultProxyType]: unwrap<defaultProxyType[P]> });

export const createPathProxy: <
  T extends (path: string[]) => any = defaultProxyType
>(
  mapper?: T
) => unwrap<T>;
