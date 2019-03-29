import { set, newRoot, getSubj, get } from './spo';

describe('SPO helpers', () => {
  test('one layer set', () => {
    const obj = newRoot();
    set(obj, ['abc'], 'def', 'ghi');
    expect(obj).toEqual({ abc: { def: 'ghi' } });
    expect(get(obj, ['abc'])).toEqual({ def: 'ghi' });
    expect(getSubj(get(obj, ['abc']))).toEqual(['abc']);
  });

  test('multilayer set', () => {
    const obj = newRoot();
    set(obj, ['a', 'b', 'c'], 'def', 'ghi');
    expect(obj).toEqual({ a: { b: { c: { def: 'ghi' } } } });
    expect(get(obj, ['a', 'b', 'c'])).toEqual({ def: 'ghi' });
    expect(getSubj(get(obj, ['a', 'b', 'c']))).toEqual(['a', 'b', 'c']);
  });

  test('links', () => {
    const obj = newRoot();
    set(obj, ['a'], 'b', 'C');
    set(obj, ['a'], 'B', ['a']);

    const result: any = { a: { b: 'C' } };
    result.a.B = result.a;

    expect(obj).toEqual(result);
    expect(get(obj, ['a'], 'b')).toEqual('C');
    expect(get(obj, ['a', 'B', 'B'], 'b')).toEqual('C');
    expect(get(obj, ['a'], 'c')).toEqual(null);
    expect(get(obj, ['a', 'B', 'B'], 'c')).toEqual(null);

    expect(getSubj(get(obj, ['a', 'b', 'c']))).toEqual(['a', 'b', 'c']);

    set(obj, ['a'], 'B', 'B');
    expect(get(obj, ['a', 'B', 'B'], 'b')).toEqual(null);
    expect(get(obj, ['a', 'B'], 'b')).toEqual(null);
    expect(get(obj, ['a'], 'B')).toEqual('B');
  });
});
