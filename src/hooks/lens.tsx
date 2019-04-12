import React, { useMemo, ReactNode } from 'react';
import { ButtonProps } from 'grommet';
import { observable, action } from 'mobx';
import { useObserver } from 'mobx-react-lite';
import { ensureNever } from '../utils/index';
import { isPromise } from '../utils/promise';

export type Lens<T> = {
  getter: () => Promise<T> | T;
  setter: (value: T) => void | Promise<void>;
};

export type LensShowComponent<T> = (
  value: T,
  actions: { editButtonProps: ButtonProps; edit: () => void }
) => ReactNode;

export type LensEditComponent<T> = (
  state: [T, (value: T) => void],
  actions: {
    saveButtonProps: ButtonProps;
    save: () => void;
    cancelButtonProps: ButtonProps;
    cancel: () => void;
  }
) => ReactNode;

export class ReactiveLens<T> {
  @observable
  public state = 'loading' as
    | 'loading'
    | 'showing'
    | 'editing'
    | 'saving'
    | 'loading-error'
    | 'saving-error';

  @observable
  public value = undefined as undefined | T;

  @observable
  public newValue = undefined as undefined | T;

  @observable
  public error = undefined as any;

  @action
  edit() {
    if (this.state === 'showing') {
      this.state = 'editing';
      this.newValue = this.value;
    } else {
      throw new Error(`ReactiveLens: wrong state ${this.state}`);
    }
  }

  fold({
    busy = () => <span>loading</span>,
    loading = busy,
    saving = busy,
    error = error => <span>error: {error}</span>,
    loadingError = error,
    savingError = error,
    show,
    edit,
  }: {
    busy?: () => ReactNode;
    loading?: () => ReactNode;
    saving?: () => ReactNode;
    error?: (error: any, reset: () => void, retry: () => void) => ReactNode;
    loadingError?: (
      error: any,
      reset: () => void,
      retry: () => void
    ) => ReactNode;
    savingError?: (
      error: any,
      reset: () => void,
      retry: () => void
    ) => ReactNode;
    show: LensShowComponent<T>;
    edit: LensEditComponent<T>;
  }): ReactNode {
    switch (this.state) {
      case 'loading':
        return useObserver(loading);
      case 'saving':
        return useObserver(saving);
      case 'loading-error':
        return useObserver(
          loadingError.bind(
            undefined,
            this.error,
            this.reset.bind(this),
            this.retry.bind(this)
          )
        );
      case 'saving-error':
        return useObserver(
          savingError.bind(
            undefined,
            this.error,
            this.reset.bind(this),
            this.retry.bind(this)
          )
        );
      case 'showing': {
        const edit = this.edit.bind(this);
        return useObserver(
          show.bind(undefined, this.value as T, {
            editButtonProps: { plain: true, onClick: edit },
            edit,
          })
        );
      }
      case 'editing': {
        const value = this.newValue as T;
        const setValue = this.setNewValue.bind(this);
        const save = this.save.bind(this);
        const cancel = this.cancel.bind(this);

        return useObserver(
          edit.bind(undefined, [value, setValue], {
            saveButtonProps: { onClick: save },
            save,
            cancelButtonProps: { onClick: cancel },
            cancel,
          })
        );
      }
      default:
        return ensureNever<ReactNode>(this.state);
    }
  }

  private doSave() {
    const result = this.lens.setter(this.newValue!);

    if (isPromise(result)) {
      result.then(this.saveSuccess.bind(this), this.saveError.bind(this));
    } else {
      this.saveSuccess();
    }
  }

  private doLoad() {
    const result = this.lens.getter();

    if (isPromise(result)) {
      result.then(this.loadSuccess.bind(this), this.loadError.bind(this));
    } else {
      this.loadSuccess(result);
    }
  }

  @action setNewValue(value: T) {
    if (this.state === 'editing') {
      this.newValue = value;
    } else {
      throw new Error(`ReactiveLens: wrong state ${this.state}`);
    }
  }

  @action
  save() {
    if (this.state === 'editing') {
      this.state = 'saving';
      this.doSave();
    } else {
      throw new Error(`ReactiveLens: wrong state ${this.state}`);
    }
  }
  @action
  private saveSuccess() {
    if (this.state === 'saving') {
      this.state = 'showing';
      this.value = this.newValue;
      this.newValue = undefined;
    } else {
      throw new Error(`ReactiveLens: wrong state ${this.state}`);
    }
  }
  @action
  private saveError(error: any) {
    if (this.state === 'saving') {
      this.state = 'saving-error';
      this.error = error;
    } else {
      throw new Error(`ReactiveLens: wrong state ${this.state}`);
    }
  }
  @action
  retry() {
    if (this.state === 'saving-error') {
      this.state = 'saving';
      this.doSave();
    } else if (this.state === 'loading-error') {
      this.state = 'loading';
      this.doLoad();
    } else {
      throw new Error(`ReactiveLens: wrong state ${this.state}`);
    }
  }
  @action
  reset() {
    if (this.state === 'saving-error') {
      this.state = 'showing';
      this.newValue = undefined;
      this.error = undefined;
    } else {
      throw new Error(`ReactiveLens: wrong state ${this.state}`);
    }
  }
  @action
  private loadSuccess(value: T) {
    if (this.state === 'loading') {
      this.state = 'showing';
      this.value = value;
    } else {
      throw new Error(`ReactiveLens: wrong state ${this.state}`);
    }
  }
  @action
  private loadError(error: any) {
    if (this.state === 'loading') {
      this.state = 'loading-error';
      this.error = error;
    } else {
      throw new Error(`ReactiveLens: wrong state ${this.state}`);
    }
  }
  @action
  cancel() {
    if (this.state === 'editing') {
      this.state = 'showing';
    } else {
      throw new Error(`ReactiveLens: wrong state ${this.state}`);
    }
  }

  constructor(public lens: Lens<T>) {
    this.doLoad();
  }
}

export function useLens<T>(lens: Lens<T>, deps: any[] = []) {
  return useMemo(() => new ReactiveLens(lens), deps);
}
