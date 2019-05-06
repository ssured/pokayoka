import {
  merge,
  ToMergeableObject,
  FromMergeableObject,
  valueAt,
} from './object-crdt';

type test = { a: { b: string } };
type mTest = ToMergeableObject<test>;
type fTest = FromMergeableObject<mTest>;

describe('simple sync state', () => {
  function s(state: number) {
    return `${state}`;
  }

  test('merge different props', () => {
    expect(
      merge<{ a?: string; b?: string }>(
        {
          a: { [s(1)]: 'one' },
        },
        {
          b: { [s(1)]: 'one' },
        }
      )
    ).toEqual({
      a: { [s(1)]: 'one' },
      b: { [s(1)]: 'one' },
    });
  });

  test('merge same props', () => {
    expect(
      merge<{ a: string }>(
        {
          a: { [s(1)]: 'one' },
        },
        {
          a: { [s(2)]: 'two' },
        }
      )
    ).toEqual({
      a: {
        [s(1)]: 'one',
        [s(2)]: 'two',
      },
    });
  });

  test('merge conflict values', () => {
    expect(
      merge<{ a: string }>(
        {
          a: { [s(1)]: 'a' },
        },
        {
          a: { [s(1)]: 'b' },
        }
      )
    ).toEqual({
      a: {
        [s(1)]: 'b',
      },
    });
    expect(
      merge<{ a: string }>(
        {
          a: { [s(1)]: 'b' },
        },
        {
          a: { [s(1)]: 'a' },
        }
      )
    ).toEqual({
      a: {
        [s(1)]: 'b',
      },
    });
  });

  test('merge same nested props', () => {
    expect(
      merge(
        {
          a: {
            [s(1)]: {
              b: {
                [s(2)]: 'two',
              },
            },
          },
        },
        {
          a: {
            [s(1)]: {
              b: {
                [s(3)]: 'three',
              },
            },
          },
        }
      )
    ).toEqual({
      a: {
        [s(1)]: {
          b: {
            [s(2)]: 'two',
            [s(3)]: 'three',
          },
        },
      },
    });
  });

  test('current returns current value', () => {
    const object = merge<{ a: string }>(
      {
        a: { [s(1)]: 'one' },
      },
      {
        a: { [s(2)]: 'two' },
      }
    );

    expect(valueAt(s(0), object)).toEqual({ a: null });
    expect(valueAt(s(1), object)).toEqual({ a: 'one' });
    expect(valueAt(s(2), object)).toEqual({ a: 'two' });
    expect(valueAt(s(3), object)).toEqual({ a: 'two' });

    merge(object, {
      a: { [s(3)]: 'three' },
    });

    expect(valueAt(s(3), object)).toEqual({ a: 'three' });
  });
});
