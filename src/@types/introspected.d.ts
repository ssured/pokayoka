declare module 'introspected' {
  export default function Introspected<T extends object | any[]>(
    objectOrArray: T,
    callback?: (root: T, path: string[]) => void
  ): T;
  export function observe<T extends object | any[]>(
    objectOrArray: T,
    callback?: (root: T, path: string[]) => void
  ): T;
  export function pathValue<T extends object | any[]>(
    objectOrArray: T,
    path: string[]
  ): any;
}
