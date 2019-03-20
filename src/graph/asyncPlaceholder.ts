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

export type ObservableAsyncPlaceholder<T> = {
  state: INITIAL | PENDING | FULFILLED | REJECTED;
  value: undefined | T;
  error: undefined | Error;
  settled: boolean;
  maybe: Maybe<T>;
  fold(
    LoadingComponent: () => ReactElement<any> | null,
    ValueComponent: (value: T) => ReactElement<any> | null,
    ErrorComponent: (error: Error) => ReactElement<any> | null,
    InitialComponent?: () => ReactElement<any> | null
  ): ReactElement<any> | null;
};

export function observableAsyncPlaceholder<T, U>(
  promise: Promise<T>,
  extraProps?: U
): (U extends undefined ? {} : U) &
  ObservableAsyncPlaceholder<T> &
  IObservableObject {
  const placeholder = observable<ObservableAsyncPlaceholder<T>>({
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
      return this.state === FULFILLED ? this.value! : nothing;
    },
    fold(
      LoadingComponent: () => ReactElement<any> | null,
      ValueComponent: (value: T) => ReactElement<any> | null,
      ErrorComponent: (error: Error) => ReactElement<any> | null,
      InitialComponent?: () => ReactElement<any> | null
    ): ReactElement<any> | null {
      if (this.state === FULFILLED) {
        return ValueComponent(this.value!);
      }
      if (this.state === PENDING) {
        return LoadingComponent();
      }
      if (this.state === REJECTED) {
        return ErrorComponent(this.error!);
      }
      return (InitialComponent || LoadingComponent)();
    },
  });

  promise
    .then(value =>
      update(() => {
        placeholder.state = FULFILLED;
        placeholder.value = value;
        placeholder.error = undefined;
      })
    )
    .catch(e =>
      update(() => {
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
