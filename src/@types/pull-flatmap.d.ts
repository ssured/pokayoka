declare module 'pull-flatmap' {
  import { Through } from 'pull-stream';

  export default function flatMap<T, U>(
    fn: (value: T) => U
  ): Through<T, U extends (infer V)[] ? V : U>;
}
