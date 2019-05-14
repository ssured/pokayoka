import { observable, ObservableMap, autorun, action, reaction } from 'mobx';
import { createRoot } from './observable-root';

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

  get serialized() {
    return {
      identifier: this.identifier,
      name: this.name,
    };
  }
}

type AnyClass = typeof User;
type AnyInstance = InstanceType<AnyClass>;

describe('it should be simple', () => {
  const source = observable.map<string, AnyInstance>();

  const disposers: Record<string, (() => void)[]> = {};

  const $ = createRoot({
    source,
    onSet: (key, value) => {
      console.log(key);
      console.log(value);
    },
    onObserved: (key, set) => {
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
          fireImmediately: isKnownAtStart,
        }),
      ];
    },
    onUnobserved: key => {
      disposers[key].forEach(dispose => dispose());
      delete disposers[key];

      console.log(key);
    },
  });

  test('it works', () => {
    autorun(() => {
      console.log($.test!.name);
    })();

    $.test!.setName('sjoerd');

    autorun(() => {
      console.log($.test!.name);
    })();

    console.log('hier');
    expect(1).toBe(1);
  });
});
