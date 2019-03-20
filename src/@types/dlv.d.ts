declare module 'dlv' {
  export default function dlv<R>(
    target: object,
    path: string | string[]
  ): R | undefined;
}
