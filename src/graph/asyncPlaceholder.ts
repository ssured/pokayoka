import { IObservableObject, observable, transaction, runInAction } from 'mobx';
import { nothing, Maybe } from './maybe';
import { ReactElement } from 'react';

export const INITIAL = 0;
type INITIAL = typeof INITIAL;
export const PENDING = 1;
type PENDING = typeof PENDING;
export const FULFILLED = 2;
type FULFILLED = typeof FULFILLED;
export const REJECTED = 3;
type REJECTED = typeof REJECTED;

export type ObservableAsyncPlaceholder<T> = (
  | {
      state: INITIAL | PENDING;
      value: undefined;
      error: undefined;
    }
  | {
      state: FULFILLED;
      value: T;
      error: undefined;
    }
  | {
      state: REJECTED;
      value: undefined;
      error: Error;
    }) & {
  settled: boolean;
  maybe: Maybe<T>;
  fold(
    LoadingComponent: () => ReactElement<any> | null,
    ValueComponent: (value: T) => ReactElement<any> | null,
    ErrorComponent: (error: Error) => ReactElement<any> | null,
    InitialComponent?: () => ReactElement<any> | null
  ): ReactElement<any> | null;
} & IObservableObject;

export function observableAsyncPlaceholder<T, U>(
  promise: Promise<T>,
  extraProps?: U
): (U extends undefined ? {} : U) & ObservableAsyncPlaceholder<T> {
  const placeholder = observable({
    ...(extraProps || {}),
    state: INITIAL as INITIAL,
    value: undefined,
    error: undefined,
    get settled() {
      // @ts-ignore
      return this.state !== INITIAL && this.state !== PENDING;
    },
    get maybe() {
      // @ts-ignore
      return this.state === FULFILLED ? this.value : nothing;
    },
    fold(
      LoadingComponent: () => ReactElement<any> | null,
      ValueComponent: (value: T) => ReactElement<any> | null,
      ErrorComponent: (error: Error) => ReactElement<any> | null,
      InitialComponent?: () => ReactElement<any> | null
    ): ReactElement<any> | null {
      // @ts-ignore
      if (this.state === FULFILLED) {
        return ValueComponent(this.value!);
      }
      // @ts-ignore
      if (this.state === PENDING) {
        return LoadingComponent();
      }
      // @ts-ignore
      if (this.state === REJECTED) {
        return ErrorComponent(this.error!);
      }
      return (InitialComponent || LoadingComponent)();
    },
  });

  promise
    .then(value =>
      update(() => {
        // @ts-ignore
        placeholder.state = FULFILLED;
        // @ts-ignore
        placeholder.value = value;
        placeholder.error = undefined;
      })
    )
    .catch(e =>
      update(() => {
        // @ts-ignore
        placeholder.state = REJECTED;
        placeholder.value = undefined;
        placeholder.error = e;
      })
    );

  return placeholder as any;
}

function update(task: () => void) {
  runInAction(() => transaction(task));
}
