import { observable, computed, action } from 'mobx';
import { KeysOfType, Omit } from './typescript';
import { primitive, SPOShape, subj } from './spo';

// https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
type IfEquals<X, Y, A, B> = (<T>() => T extends X ? 1 : 2) extends (<
  T
>() => T extends Y ? 1 : 2)
  ? A
  : B;

// Alternatively:
/*
  type IfEquals<X, Y, A, B> =
  [2] & [0, 1, X] extends [2] & [0, 1, Y] & [0, infer W, unknown]
  ? W extends 1 ? B : A
  : B;
  */

type WritableKeysOf<T> = {
  [P in keyof T]: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P,
    never
  >
}[keyof T];
type WritablePart<T> = Pick<T, WritableKeysOf<Required<T>>>;
type ReadOnlyPart<T> = Omit<T, WritableKeysOf<Required<T>>>;

type tFunction = (...args: any[]) => any;

type ComputedKeys<T> = Exclude<keyof T, WritableKeysOf<Required<T>>>;
type ActionKeys<T> = KeysOfType<Required<T>, tFunction> &
  WritableKeysOf<Required<T>>;

type PrimitiveKeys<T> = KeysOfType<Required<T>, primitive> &
  WritableKeysOf<Required<T>>;
type RefKeys<T> = Exclude<
  WritableKeysOf<Required<T>>,
  KeysOfType<Required<T>, primitive | tFunction | Set<any>>
>;
type SetKeys<T> = KeysOfType<Required<T>, Set<any>> &
  WritableKeysOf<Required<T>>;

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
