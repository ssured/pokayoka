import { JsonMap } from '../utils/json';
import { observable, isObservable, configure } from 'mobx';
import dlv from 'dlv';
import dset from 'dset';
import produce, { Patch } from 'immer';

configure({ enforceActions: 'always' });

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

type KeysOfType<A extends object, B> = {
  [K in keyof A]-?: A[K] extends B ? K : never
}[keyof A];

type Functionalize<T extends JsonMap, U extends JsonMap> = {
  [K in keyof T]: {
    (): Partial<T[K]> & U;
  } & (T[K] extends JsonMap
    ? Functionalize<Pick<T[K], KeysOfType<T[K], JsonMap>>, U>
    : {})
};

function createTypeProxy<
  T extends { [key: string]: JsonMap },
  U extends JsonMap
>(
  factory: (path: string[]) => U
): Functionalize<T & { [key: string]: JsonMap }, U> {
  const createdObjects: { [key: string]: U } = {};

  const cachedFactory = (path: string[]) => {
    const key = `[${path.join('!')}]`;
    let object = dlv<ReturnType<typeof factory>>(createdObjects, key);
    if (object == null) {
      object = factory(path);
      dset(createdObjects, key, object);
    }
    return object;
  };

  function proxyFactory(path: string[] = []): any {
    const proxy = new Proxy(() => cachedFactory(path), {
      get(_, key) {
        return typeof key === 'string'
          ? proxyFactory(path.concat(key))
          : undefined;
      },
    });
    return proxy;
  }
  return proxyFactory();
}

// function genWorld<T extends { [key: string]: JsonMap }>(): Functionalize<
//   T & { [key: string]: { [key: string]: JsonEntry } }
// > {
//   return {} as any;
// }

describe('map typescript definition to mobx observables', () => {
  test('it works', () => {
    const factory = (path: string[]) => {
      // only called once per path
      const result = observable({ path });
      // do some side effect here
      return result;
    };
    const w = createTypeProxy<
      {
        sun: {
          earth: {
            continent: string;
          };
          asteroids: {
            [key: string]: {
              moons: {
                name: string;
              };
            };
          };
        };
      },
      ReturnType<typeof factory>
    >(factory);

    expect(w.sun().path).toEqual(['sun']);
    expect(w.sun.earth().path).toEqual(['sun', 'earth']);
    expect(isObservable(w.sun.earth().path)).toBe(true);
    expect(w.sun.asteroids.any.moons().name);
  });
});

describe('immer working with mobx', () => {
  test('immer can update a mobx object', () => {
    const source: {
      name?: string;
    } = {};

    let patches1: Patch[];

    const next1 = produce<typeof source>(
      source,
      () => {
        source.name = 'test';
      },
      patches => (patches1 = patches)
    );

    expect(next1.name).toBe('test');

    // === observable tests

    const observableSource = observable(source);

    let patches2: Patch[];
    const next2 = produce<typeof source>(
      observableSource,
      () => {
        source.name = 'test';
      },
      patches => (patches2 = patches)
    );

    expect(next2.name).toBe('test');

    // @ts-ignore
    expect(patches1).toEqual(patches2);

    console.log(typeof produce(() => {}, () => {}));
  });
});

// import {
//   observable,
//   onBecomeObserved,
//   IObservableObject,
//   runInAction,
//   isObservable,
// } from 'mobx';
// import dlv from 'dlv';
// import dset from 'dset';
// import { JsonEntry, JsonMap } from '../utils/json';
// import SubscribableEvent from 'subscribableevent';

// function bigBang<T>(): T {
//   const center = {};
//   return {} as T;
// }

// class Galaxy<S extends { [key: string]: JsonMap }> {
//   private newStarNotifier = new SubscribableEvent<
//     (galaxy: Galaxy<S>, location: string) => void
//   >();
//   public onNewborn(listener: (galaxy: Galaxy<S>, location: string) => void) {
//     const subscription = this.newStarNotifier.subscribe(listener);
//     return () => subscription.unsubscribe();
//   }

//   private center: S & { [key: string]: JsonMap };
//   private objectLocations = new WeakMap<object, string[]>();

//   private fuse(dust: JsonMap): JsonMap & IObservableObject {
//     const core = observable(dust);

//     const { fuse } = this; // tslint:disable-line

//     return new Proxy(core, {
//       get(star, key) {
//         if (typeof key === 'string') {
//           const obj = star[key];
//           if (obj) return obj;

//           runInAction(() => (star[key] = fuse({})));

//           return star[key];
//         }
//         return Reflect.get(star, key);
//       },
//     });
//   }

//   private createStarAtLocation(location: string): JsonMap & IObservableObject {
//     const starDust = this.collectStardustAtLocation(location);
//     const star = this.fuse(starDust);
//     this.objectLocations.set(star, [location]);

//     this.newStarNotifier.fire(this, location);
//     return star;
//   }

//   constructor(
//     private collectStardustAtLocation: (
//       location: string
//     ) => JsonMap = () => ({})
//   ) {
//     const galaxy = this;
//     this.center = new Proxy<S & { [key: string]: JsonMap }>({} as any, {
//       get(object, key) {
//         if (typeof key === 'string') {
//           const star = object[key];
//           if (star) return star;

//           return (object[key] = galaxy.createStarAtLocation(key));
//         }
//         return Reflect.get(object, key);
//       },
//     }) as any;
//   }

//   getStar<T extends string>(
//     location: T
//   ): (S & { [key: string]: JsonMap })[T] & IObservableObject {
//     return this.center[location] as any;
//   }

//   getLocation(obj: object) {
//     return this.objectLocations.get(obj);
//   }
// }

// describe('galaxy', () => {
//   test('it holds stars', () => {
//     const milkyWay = new Galaxy<{
//       sun: { n: number };
//     }>();
//     const sun = milkyWay.getStar('sun');
//     expect(typeof sun).toBe('object');
//     expect(milkyWay.getStar('sun')).toBe(sun);
//     const alphaCentaury = milkyWay.getStar('alphaCentaury');

//     expect(milkyWay.getLocation(sun)).toEqual(['sun']);

//     expect(isObservable(sun)).toBe(true);
//     expect(isObservable(sun.earth)).toBe(true);
//   });
// });

// const map: {
//   [key: string]: JsonMap;
// } = {};

// type StarLocation = [string];
// type Star = {
//   [key: string]: JsonEntry;
// };

// type SubjectLocation = [string, string, ...string[]]; // at least 2 strings

// describe('ingredients', async () => {
//   test('mobx exposes which properties are being observed, even with the properties not existing', () => {
//     const subject = observable({});

//     // onBecomeObserved(subject, ()
//   });
// });

// function get<T extends object, P1 extends keyof T>(obj: T, prop1: P1): T[P1];

// function get<T extends object, P1 extends keyof T, P2 extends keyof T[P1]>(
//   obj: T,
//   prop1: P1,
//   prop2: P2
// ): T[P1][P2];

// function get<
//   T extends object,
//   P1 extends keyof T,
//   P2 extends keyof T[P1],
//   P3 extends keyof T[P1][P2]
// >(obj: T, prop1: P1, prop2: P2, prop3: P3): T[P1][P2][P3];

// function get(obj: any, ...props: (string | number)[]): any {
//   return props.reduce((result, prop) => result && result[prop], obj);
// }
