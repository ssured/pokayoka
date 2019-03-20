declare module 'pull-abortable' {
  import { Through } from 'pull-stream';

  export default function createAbortable<T>(): Through<T, T> & {
    abort: () => void;
  };
}
