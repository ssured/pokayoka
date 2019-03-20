declare module 'dset' {
  export default function dset<T extends object>(
    target: T,
    path: string | string[],
    value: any
  ): void;
}
