import { merge, HamValue } from './merge';

describe('ham objects merge', () => {
  test('it merges simple objects', () => {
    expect(
      merge(3, [2, { a: 2 }], { a: 'A' }, [1, { a: 1 }], { a: 'a' })
    ).toEqual({
      resultHam: [2, { a: 2 }],
      resultValue: { a: 'A' },
      currentChanged: true,
    });

    // order does not matter
    expect(
      merge(3, [1, { a: 1 }], { a: 'a' }, [2, { a: 2 }], { a: 'A' })
    ).toEqual({
      resultHam: [2, { a: 2 }],
      resultValue: { a: 'A' },
      currentChanged: false,
    });

    // defer if in future
    expect(
      merge(1, [2, { a: 2 }], { a: 'A' }, [1, { a: 1 }], { a: 'a' })
    ).toEqual({
      resultHam: [1, { a: 1 }],
      resultValue: { a: 'a' },
      currentChanged: false,
      deferUntilState: 2,
    });

    // adding properties
    expect(
      merge(4, [1, { b: 3 }], { b: 'b' }, [1, { a: 2 }], { a: 'a' })
    ).toEqual({
      resultHam: [1, { a: 2, b: 3 }],
      resultValue: { a: 'a', b: 'b' },
      currentChanged: true,
    });

    // equal
    expect(
      merge(4, [1, { a: 2 }], { a: 'a' }, [1, { a: 2 }], { a: 'a' })
    ).toEqual({
      resultHam: [1, { a: 2 }],
      resultValue: { a: 'a' },
      currentChanged: false,
    });
  });

  test('it prefers larger value when states are equal and type is equal', () => {
    expect(
      merge(3, [2, { a: 2 }], { a: 'z' }, [2, { a: 2 }], { a: 'a' })
    ).toEqual({
      resultHam: [2, { a: 2 }],
      resultValue: { a: 'z' },
      currentChanged: true,
    });

    expect(
      merge(3, [2, { a: 2 }], { a: 'a' }, [2, { a: 2 }], { a: 'z' })
    ).toEqual({
      resultHam: [2, { a: 2 }],
      resultValue: { a: 'z' },
      currentChanged: false,
    });

    expect(
      merge(3, [2, { a: 2 }], { a: 'a' }, [2, { a: 2 }], { a: undefined })
    ).toEqual({
      resultHam: [2, { a: 2 }],
      resultValue: { a: 'a' },
      currentChanged: true,
    });
    expect(
      merge(3, [2, { a: 2 }], { a: undefined }, [2, { a: 2 }], { a: 'a' })
    ).toEqual({
      resultHam: [2, { a: 2 }],
      resultValue: { a: 'a' },
      currentChanged: false,
    });
  });

  test('it prefers objects over primitives', () => {
    expect(
      merge(3, [2, { a: 2 }], { a: { b: 'B' } }, [2, { a: 2 }], { a: 'a' })
    ).toEqual({
      resultHam: [2, { a: 2 }],
      resultValue: { a: { b: 'B' } },
      currentChanged: true,
    });

    expect(
      merge(3, [2, { a: 2 }], { a: 'a' }, [2, { a: 2 }], { a: { b: 'B' } })
    ).toEqual({
      resultHam: [2, { a: 2 }],
      resultValue: { a: { b: 'B' } },
      currentChanged: false,
    });
  });

  test('it merges nested objects', () => {
    expect(
      merge(
        3,
        [1, { sub: [2, { a: 2 }] }],
        { sub: { a: 'A' } },
        [1, { a: 1 }],
        { a: 'a' }
      )
    ).toEqual({
      resultHam: [1, { a: 1, sub: [2, { a: 2 }] }],
      resultValue: { a: 'a', sub: { a: 'A' } },
      currentChanged: true,
    });
  });

  test('it merges nested objects, and notifies of future values', () => {
    expect(
      merge(
        3,
        [1, { sub: [2, { a: 2, b: 4 }] }],
        { sub: { a: 'A', b: 'future value' } },
        [1, { a: 1 }],
        { a: 'a' }
      )
    ).toEqual({
      resultHam: [1, { a: 1, sub: [2, { a: 2 }] }],
      resultValue: { a: 'a', sub: { a: 'A' } },
      currentChanged: true,
      deferUntilState: 4,
    });
  });

  test('returns a defer state if only partial merge happened', () => {
    expect(
      merge(2, [1, { b: 2, c: 3 }], { b: 2, c: 3 }, [1, { a: 1 }], { a: 1 })
    ).toEqual({
      resultHam: [1, { a: 1, b: 2 }],
      resultValue: { a: 1, b: 2 },
      currentChanged: true,
      deferUntilState: 3,
    });
  });

  test('it stores deleted keys of nested objects', () => {
    expect(
      merge(
        4,
        [1, { sub: [2, { a: 2, b: 3 }] }],
        { sub: { a: 'A' } },
        [1, { sub: [2, { a: 2, b: 2 }] }],
        { sub: { a: 'A', b: 'B' } }
      )
    ).toEqual({
      resultHam: [1, { sub: [2, { a: 2, b: 3 }] }],
      resultValue: { sub: { a: 'A' } },
      currentChanged: true,
    });
  });
});

describe('real world usage', () => {
  test('something with the _rev not appearing in the result value', () => {
    const inSnap = {
      _id: 'cisvmclrpxin',
      _rev: '3045-132fec4e1aac785e74ac884ae0da5dac',
      '#': [
        1543234836586,
        {
          type: 1543234836586,
          _id: 1543234836586,
          name: 1543243812705,
          plans: [1543246278801, { cit4g6b5xqop: 1543246278801 }],
        },
      ] as HamValue,
      type: 'project',
      name: '1234',
      plans: {
        cit4g6b5xqop: {
          type: 'plan',
          _id: 'cit4g6b5xqop',
          name: 'plan 1543246278800',
        },
      },
    };
    const curSnap = {
      type: 'project',
      _id: 'cisvmclrpxin',
      '#': [
        1543234836586,
        {
          type: 1543234836586,
          _id: 1543234836586,
          name: 1543243812705,
          plans: [1543246278801, { cit4g6b5xqop: 1543246278801 }],
        },
      ] as HamValue,
      name: '1234',
      plans: {
        cit4g6b5xqop: {
          type: 'plan',
          _id: 'cit4g6b5xqop',
          name: 'plan 1543246278800',
        },
      },
    };

    const result = merge(
      Date.now(),
      inSnap['#'],
      inSnap,
      curSnap['#'],
      curSnap
    );
    expect({
      ...result.resultValue,
      '#': result.resultHam,
    }).toEqual({
      type: 'project',
      _id: 'cisvmclrpxin',
      '#': [
        1543234836586,
        {
          type: 1543234836586,
          _id: 1543234836586,
          name: 1543243812705,
          plans: [1543246278801, { cit4g6b5xqop: 1543246278801 }],
        },
      ],
      name: '1234',
      plans: {
        cit4g6b5xqop: {
          type: 'plan',
          _id: 'cit4g6b5xqop',
          name: 'plan 1543246278800',
        },
      },
    });
  });

  it('something with nested records', () => {
    const {
      machineState,
      incomingHam,
      incomingValue,
      currentHam,
      currentValue,
    } = {
      machineState: 1543263315259,
      incomingHam: [
        1543234836586,
        {
          type: 1543234836586,
          _id: 1543234836586,
          name: 1543243812705,
          plans: [
            1543246278801,
            { cit4g6b5xqop: [1543246278801, { '#': 1543263315073 }] },
          ],
          _rev: 1543262325753,
        },
      ] as HamValue,
      incomingValue: {
        type: 'project',
        _id: 'cisvmclrpxin',
        '#': [
          1543234836586,
          {
            type: 1543234836586,
            _id: 1543234836586,
            name: 1543243812705,
            plans: [
              1543246278801,
              { cit4g6b5xqop: [1543246278801, { '#': 1543263315073 }] },
            ],
            _rev: 1543262325753,
          },
        ],
        name: '1234',
        plans: {
          cit4g6b5xqop: {
            type: 'plan',
            _id: 'cit4g6b5xqop',
            name: 'plan 1543246278800',
          },
        },
      },
      currentHam: [
        1543234836586,
        {
          type: 1543234836586,
          _id: 1543234836586,
          name: 1543243812705,
          plans: [1543246278801, { cit4g6b5xqop: 1543246278801 }],
          _rev: 1543262325753,
        },
      ] as HamValue,
      currentValue: {
        _id: 'cisvmclrpxin',
        '#': [
          1543234836586,
          {
            type: 1543234836586,
            _id: 1543234836586,
            name: 1543243812705,
            plans: [1543246278801, { cit4g6b5xqop: 1543246278801 }],
            _rev: 1543262325753,
          },
        ],
        type: 'project',
        name: '1234',
        plans: {
          cit4g6b5xqop: {
            type: 'plan',
            _id: 'cit4g6b5xqop',
            name: 'plan 1543246278800',
          },
        },
        _rev: '3236-81275a1419d7075f47b79215e7e41791',
      },
    };
    expect(() =>
      merge(machineState, incomingHam, incomingValue, currentHam, currentValue)
    ).not.toThrow();
  });
});
