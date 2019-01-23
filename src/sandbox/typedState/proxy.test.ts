import { createPathProxy, anyProp } from './proxy';

describe('pathproxy', () => {
  test('it follows its path', () => {
    const a = createPathProxy();
    expect(a.b.c()).toEqual(['b', 'c']);
  });

  test('it remembers its path', () => {
    const a = createPathProxy();
    const b = a.b;

    type c = (typeof b)['c'];

    const addC = <U>(o: {
      [key: string]: any;
    }): (typeof o)['c'] extends () => U ? (typeof o)['c'] : never => o.c;

    expect(addC<string[]>(b)()).toEqual(['b', 'c']);
  });

  //   test('typescript protects function properties', () => {
  //     const a = createPathProxy();
  //     expect(a.b.length()).toEqual(['b', 'length']);
  //     expect(a.c.length()).toEqual(['c', 'length']);
  //   });

  test('it can decorate its functions', async () => {
    const a = createPathProxy(
      Object.assign((path: string[]) => path, {
        b: Object.assign(
          (path: string[]) => Promise.resolve(JSON.stringify(path)),
          {
            c: (path: string[]) => path.length,
            [anyProp]: (path: string[]) => JSON.stringify(path),
          }
        ),
      })
    );

    expect(await a.b()).toBe('["b"]');
    expect(typeof a.b.c()).toBe('number');
    expect(typeof a.b.d()).toBe('string');
  });

  const extend = <
    F extends (path: string[]) => any,
    P extends { [key: string]: any },
    A extends (path: string[]) => any = F
  >(
    fn: F,
    props: P,
    any?: A
  ) =>
    Object.assign(fn, props, any ? { [anyProp]: any } : {}) as {
      (...args: Parameters<F>): ReturnType<F>;
    } & P & { [key: string]: A };

  //   const f = extend(
  //     (path: string[]) => path.length,
  //     {
  //       someValue: 3,
  //     },
  //     path => Promise.resolve(path.length)
  //   );
  //   const a = f(['test']);
  //   const v = f.someValue;
  //   const b = f.other;

  test('it exposes its parent', async () => {
    // type recursive<T> = { [key: string]: (() => T) & recursive<T> };
    // const a = createPathProxy<{
    //   [key: string]: (() => [string, string]) & {
    //     [key: string]: () => string;
    //   };
    // }>();
    const format = extend(
      path => path,
      {
        b: extend((path: string[]) => path, {
          c: (path: string[]) => path.length,
        }),
      },
      path => Promise.resolve(path.length)
    );

    const a = createPathProxy(format);

    const otherprop = a.otherprop();
    expect(await otherprop).toBe(1);

    const c = a.b.c;

    expect(typeof c()).toBe('number');

    const getParent = (obj: any) => obj['..'];

    expect(getParent(getParent(c))).toBe(a);
  });
});
