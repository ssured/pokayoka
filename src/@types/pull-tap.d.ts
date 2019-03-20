declare module 'pull-tap' {
  import { Through } from 'pull-stream';

  export function tap<T>(sideEffect: (value: T) => void): Through<T, T>;

  export function asyncTap<T>(
    sideEffect: (value: Through<T, any>) => void
  ): Through<T, T>;
}
