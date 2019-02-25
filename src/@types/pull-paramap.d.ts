declare module 'pull-paramap' {
  import { Through } from 'pull-stream';

  export default function paraMap<T, U>(
    fn: (
      value: T,
      cb: (err: Error | null | undefined, value: U) => void
    ) => void,
    parallel: number,
    keepOrder: boolean
  ): Through<T, U>;
}
