import {
  observable,
  extendObservable,
  IObservableObject,
  configure,
  runInAction,
  action,
  set,
} from 'mobx';
import { createViewModel, IViewModel } from 'mobx-utils';

configure({ enforceActions: 'always' });

function decorate<T extends Object, U extends Object>(
  source: T,
  decoration: U
) {
  return extendObservable(createViewModel(source), decoration);
}

type Site = {
  name: string;
};

type Project = {
  name: string;
  sites?: Record<string, Site>;
};

type Initial<T> = { [K in keyof Required<T>]: (Required<T>[K] | undefined) };

type Defines<T> = {
  is: (obj: unknown) => obj is T;
  initial: Initial<T>;
};

const Project: Defines<Project> = {
  is: (obj): obj is Project =>
    typeof obj === 'object' && obj != null && (obj as any).type === 'project',
  initial: {
    name: '',
    sites: undefined,
  },
};

describe('viewmodel to decorate an observable', () => {
  test('self decoration', () => {
    const source = observable(
      {
        text: 'test',

        setText(text: string) {
          this.text = text;
        },

        get uText(): string {
          return this.text.toUpperCase();
        },

        decorate<T extends Object>(decoration: T) {
          return decorate(this, decoration);
        },
      },
      {
        decorate: action,
        setText: action,
      }
    );

    expect(source.uText).toBe('TEST');

    const sourceDecoration = {
      get doubleText(this: typeof source) {
        return this.text + this.text;
      },
    };

    const view = source.decorate(sourceDecoration);

    expect(view.text).toBe('test');
    expect(view.uText).toBe('TEST');
    expect(view.doubleText).toBe('testtest');

    view.setText('new value');
    expect(view.text).toBe('new value');
    expect(source.text).toBe('test');

    view.submit();
    expect(source.text).toBe('new value');

    // set(source, { other: 'value' });
    // expect(view.other).toBe('value');
  });
});
