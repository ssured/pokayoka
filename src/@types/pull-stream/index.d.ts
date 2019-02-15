declare module 'pull-stream' {
  type End = null | true | Error;
  type Callback<T> = (err: End, value?: T) => void;
  type Abort = (err: null | Error) => void;

  export type Source<T> = (end: End, cb: Callback<T>) => void;
  export type Sink<T, U = void> = (read: Source<T>) => U;
  export type Through<T, U> = Sink<T, Source<U>>;
  export type Duplex<T> = { source: Source<T>; sink: Sink<T> };

  // define pull up to 5 arguments:
  export function pull<T>(s1: Source<T>, s2: Sink<T>): void;
  export function pull<T, U>(s1: Source<T>, s2: Through<T, U>): Source<U>;
  export function pull<T, U>(s1: Through<T, U>, s2: Sink<U>): void;
  export function pull<T, U, V>(
    s1: Through<T, U>,
    s2: Through<U, V>
  ): Source<U>;

  export function pull<T, U>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Sink<U>
  ): void;
  export function pull<T, U, V>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>
  ): Source<V>;
  export function pull<S, T, U>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Sink<U>
  ): void;
  export function pull<S, T, U, V>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>
  ): Source<V>;

  export function pull<T, U, V>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Sink<V>
  ): void;
  export function pull<T, U, V, R>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, R>
  ): Source<R>;
  export function pull<S, T, U, V>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Sink<V>
  ): void;
  export function pull<S, T, U, V, R>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, R>
  ): Source<R>;

  export function pull<T, U, V, W>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Sink<W>
  ): void;
  export function pull<T, U, V, W, R>(
    s1: Source<T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, R>
  ): Source<R>;
  export function pull<S, T, U, V, W>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Sink<W>
  ): void;
  export function pull<S, T, U, V, W, R>(
    s1: Through<S, T>,
    s2: Through<T, U>,
    s3: Through<U, V>,
    s4: Through<V, W>,
    s5: Through<W, R>
  ): Source<R>;

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
  export function filter<T>(test: (data: T) => boolean): Through<T, T>;
  export function filterNot<T>(test: (data: T) => boolean): Through<T, T>;
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
