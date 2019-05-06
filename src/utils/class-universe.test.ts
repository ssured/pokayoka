import { observable, computed, action } from 'mobx';
import { KeysOfType, Omit } from './typescript';
import { primitive, SPOShape, subj } from './spo';

describe('observable classes', () => {
  test('mobx classes', () => {
    class Right {
      @observable
      public value: string = '';
    }

    class Left {
      static right = Right;

      @observable
      public value: number = 0;

      @observable
      public right: Right = new Right();

      @observable
      public directions?: Set<Right> = new Set();

      @computed
      get double() {
        const ctor = (this.constructor as typeof Left).right;
        return this.value * 2;
      }

      @action
      sum(another: number) {
        return this.value + another;
      }
    }

    type LeftClass = typeof Left;
    type r = LeftClass['right'];

    type computedKeys2 = ComputedKeys<Left>;
    type propKeys2 = PrimitiveKeys<Left>;
    type actionKeys2 = ActionKeys<Left>;
    type refKeys2 = RefKeys<Left>;
    type setKeys2 = SetKeys<Left>;

    const direction = new Left();
  });
});

/* class decorator */
function staticImplements<T>() {
  return (constructor: StaticConstructors<T>) => constructor;
}

type InstanceShape<T> = T & {
  instanceMethod: () => void;
};

type StaticConstructors<T> = {
  new (subj: subj, initialValue: Partial<WritablePart<T>>): InstanceShape<T>;
  connect: (subj: subj) => Promise<InstanceShape<T>>;
} & { [K in PrimitiveKeys<T>]: () => T[K] };

/* this statement implements both normal interface & static interface */
@staticImplements<ProjectV1>()
class ProjectV1 {
  /* implements MyType { */ /* so this become optional not required */
  public static connect(subj: subj) {
    return Promise.resolve(new this([], {}));
  }
  instanceMethod() {}

  constructor(subj: string[], initialValue: Partial<WritablePart<ProjectV1>>) {
    Object.assign(this, initialValue);
  }

  public static value = () => Date.now();
  @observable
  public value: number = 0;

  // public get ctor() { return this.constructor as typeof ProjectV1}
}

declare global {
  type IFCProject = ProjectV1;
}
