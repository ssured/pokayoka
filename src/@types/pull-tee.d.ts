declare module 'pull-tee' {
  import { Through, Sink } from 'pull-stream';

  export default function tee<T>(
    sinks: (Through<T, any> | Sink<T>)[]
  ): Through<T, T>;
}
