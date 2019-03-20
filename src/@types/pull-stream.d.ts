declare module 'pull-stream' {
  type End = null | true | Error;
  type Callback<T> = (err: End, value?: T) => void;
  type Abort = (err: null | Error) => void;

  export type Source<T = any> = (end: End, cb: Callback<T>) => void;
  export type Sink<T = any> = (read: Source<T>) => void;
  export type Through<T = any, U = any> = (
    read: Source<T>
  ) => (end: End, cb: Callback<U>) => void;
  export type Duplex<T = any> = { source: Source<T>; sink: Sink<T> };

  // define pull up to 5 arguments:
  export default function pull<T, U, V>(
    s1: Through<T, U>,
    s2: Through<U, V>
  ): Source<V>;
  export default function pull<T, U>(
    s1: Source<T>,
    s2: Through<T, U>
  ): Source<U>;
  export default function pull<T, U>(s1: Through<T, U>, s2: Sink<U>): Sink<T>;
  export default function pull<T>(s1: Source<T>, s2: Sink<T>): void;

  export default function pull<T, U, V>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>
  ): Source<V>;
  export default function pull<T, U>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Sink<U>
  ): void;
  export default function pull<S, T, U, V>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>
  ): Source<V>;
  export default function pull<S, T, U>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Sink<U>
  ): Sink<S>;

  export default function pull<T, U, V, R>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, R>
  ): Source<R>;
  export default function pull<T, U, V>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Sink<V>
  ): void;
  export default function pull<S, T, U, V, R>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, R>
  ): Source<R>;
  export default function pull<S, T, U, V>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Sink<V>
  ): Sink<S>;

  export default function pull<T, U, V, W, R>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, R>
  ): Source<R>;
  export default function pull<T, U, V, W>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Sink<W>
  ): void;
  export default function pull<S, T, U, V, W, R>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, R>
  ): Source<R>;
  export default function pull<S, T, U, V, W>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Sink<W>
  ): Sink<S>;

  export default function pull<T, U, V, W, X, R>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, X>,
    s6: Through<X, R>
  ): Source<R>;
  export default function pull<T, U, V, W, X>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, X>,
    s6: Sink<X>
  ): void;
  export default function pull<S, T, U, V, W, X, R>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, X>,
    s6: Through<X, R>
  ): Source<R>;
  export default function pull<S, T, U, V, W, X>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, X>,
    s6: Sink<X>
  ): Sink<S>;

  export default function pull<T, U, V, W, X, Y, R>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, X>,
    s6: Through<X, Y>,
    s7: Through<Y, R>
  ): Source<R>;
  export default function pull<T, U, V, W, X, Y>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, X>,
    s6: Through<X, Y>,
    s7: Sink<Y>
  ): void;
  export default function pull<S, T, U, V, W, X, Y, R>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, X>,
    s6: Through<X, Y>,
    s7: Through<Y, R>
  ): Source<R>;
  export default function pull<S, T, U, V, W, X, Y>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, X>,
    s6: Through<X, Y>,
    s7: Sink<Y>
  ): Sink<S>;

  export default function pull<T, U, V, W, X, Y, Z, R>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, X>,
    s6: Through<X, Y>,
    s7: Through<Y, Z>,
    s8: Through<Z, R>
  ): Source<R>;
  export default function pull<T, U, V, W, X, Y, Z>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, X>,
    s6: Through<X, Y>,
    s7: Through<Y, Z>,
    s8: Sink<Z>
  ): void;
  export default function pull<S, T, U, V, W, X, Y, Z, R>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, X>,
    s6: Through<X, Y>,
    s7: Through<Y, Z>,
    s8: Through<Z, R>
  ): Source<R>;
  export default function pull<S, T, U, V, W, X, Y, Z>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, X>,
    s6: Through<X, Y>,
    s7: Through<Y, Z>,
    s8: Sink<Z>
  ): Sink<S>;

  // source
  export function keys<T, U extends keyof T>(
    obj: T,
    onAbort?: Abort
  ): Source<U>;
  export function once<T>(value: T, onAbort?: Abort): Source<T>;
  export function values<T>(
    obj: { [s: string]: T } | ArrayLike<T>,
    onAbort?: Abort
  ): Source<T>;
  export function count(max?: number, onAbort?: Abort): Source<number>;
  export function infinite<T = number>(
    generator?: () => T,
    onAbort?: Abort
  ): Source<T>;
  export function empty(): Source<unknown>;
  export function error(err: Error): Source<unknown>;

  // through
  export function through<T>(
    op?: (data: T) => void,
    onAbort?: Abort
  ): Through<T, T>;
  export function map<T, U>(fn: (data: T) => U, onAbort?: Abort): Through<T, U>;
  export function asyncMap<T, U>(
    fn: (data: T, cb: Callback<U>) => void
  ): Through<T, U>;
  export function filter<T, U = T>(test: (data: T) => boolean): Through<T, U>;
  export function filterNot<T, U = T>(
    test: (data: T) => boolean
  ): Through<T, U>;
  export function take<T>(
    test: number | ((data: T) => boolean),
    opts?: { last: boolean }
  ): Through<T, T>;
  export function unique<T>(prop: string | ((data: T) => any)): Through<T, T>;
  export function nonUnique<T>(
    prop: string | ((data: T) => any)
  ): Through<T, T>;
  export function flatten<T>(streams: Source<T>[] | T[][]): Through<T, T>;

  // sink
  export function drain<T>(
    op: (data: T) => void | false,
    done?: Abort
  ): Sink<T>;
  export function onEnd<T>(done: Abort): Sink<T>;
  export function log<T>(): Sink<T>;
  export function find<T>(test: (data: T) => boolean, done?: Abort): Sink<T>;
  export function find<T>(done?: Abort): Sink<T>;
  export function reduce<T, U>(
    reduce: (current: U, data: T) => U,
    initial: U,
    cb: Callback<U>
  ): Sink<T>;
  export function collect<T>(cb: Callback<T[]>): Sink<T>;
  export function concat<T extends string>(cb: Callback<string>): Sink<T>;
}
