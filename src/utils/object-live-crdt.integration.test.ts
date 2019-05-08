import { observable, action } from 'mobx';
import {
  create,
  staticImplements,
  defaultCreate,
  defaultMerge,
} from './object-live-crdt';

@staticImplements<Hello>()
class Hello {
  static '@type' = 'Hello';
  constructor(readonly identifier: string) {}
  static create = defaultCreate.bind(Hello as any) as any;
  static merge = defaultMerge.bind(Hello as any) as any;
  static destroy(hello: Hello) {}

  static serialize(hello: Hello) {
    return {
      greet: hello.greet,
    };
  }

  @observable
  greet = '';

  get GREET() {
    return this.greet.toUpperCase();
  }

  @action
  setGreet(greet: string) {
    this.greet = greet;
  }
}

describe('one class', () => {
  const state = observable.box(1);
  const getState = () => String(state.get());

  beforeEach(() => {
    state.set(1);
  });

  test('create', () => {
    const hello = create(
      getState,
      [],
      Hello,
      observable.object({
        '@type': { '1': 'Hello' as const },
        identifier: { '1': 'yo' },
        greet: { '1': 'yo' },
      })
    );

    expect(hello.greet).toEqual('yo');
    expect(hello.GREET).toEqual('YO');
  });
});
