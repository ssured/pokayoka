import {
  observable,
  ObservableMap,
  autorun,
  action,
  reaction,
  runInAction,
} from 'mobx';
import { createRoot } from './observable-root';

describe('it should be simple', () => {
  type AnyClass = typeof User;
  type AnyInstance = InstanceType<AnyClass>;

  const source = observable.map<string, AnyInstance>();

  const disposers: Record<string, (() => void)[]> = {};

  const $ = createRoot({
    source,
    onSet: (key, value) => {},
    onObserved: (key, set) => {
      console.log(key);
      const isKnownAtStart = source.has(key);

      if (!isKnownAtStart) {
        const user = new User(key);
        user.setName(key);
        source.set(key, user);
      }

      const instance = source.get(key)!;
      set(instance);

      const getSerialized = () => instance.serialized;
      const updateSerialized = (serialized: any) => {
        console.log(serialized);
      };

      disposers[key] = [
        reaction(getSerialized, updateSerialized, {
          fireImmediately: true,
        }),
      ];
    },
    onUnobserved: key => {
      disposers[key].forEach(dispose => dispose());
      delete disposers[key];

      console.log(key);
    },
  });

  class Base {
    constructor(public readonly identifier: string) {}
  }

  class User extends Base {
    @observable
    name = '';

    @action
    setName(name: string) {
      this.name = name;
    }

    @observable
    _ref: User | [string] | null = null;

    get ref() {
      return Array.isArray(this._ref) ? ($[this._ref[0]] as User) : this._ref;
    }
    set ref(value: User | null) {
      this._ref = value;
    }

    get serialized() {
      return {
        identifier: this.identifier,
        name: this.name,
        ref: this.ref && [this.ref.identifier],
      };
    }
  }

  test('it works', () => {
    autorun(() => {
      console.log($.test!.name);
    })();

    autorun(() => {
      $.test!.setName('sjoerd');
      console.log($.test!.ref);
      console.log($.dude);
      runInAction(() => {
        $.test!.ref = $.dude;
      });
    })();

    autorun(() => {
      console.log($.test.ref && $.test.ref.name);
    })();

    console.log($.test!.serialized);

    console.log('hier');
    expect(1).toBe(1);
  });
});
