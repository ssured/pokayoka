import { createHAMProxy, isHAMObject, toTuple, HAMObject } from './ham';

describe('smart HAM proxy', () => {
  test('fails to create on non HAM objects', () => {
    expect(() =>
      createHAMProxy(({ a: 'a' } as unknown) as HAMObject)
    ).toThrow();
  });

  test('it converts values', async () => {
    const raw = { a: [123, 'a'] };
    expect(isHAMObject(raw)).toBe(true);
    const obj = createHAMProxy((raw as unknown) as HAMObject);

    expect(raw.a).toEqual([123, 'a']);
    expect(obj.a).toEqual('a');

    obj.a = toTuple('A');

    expect(obj.a).toEqual('A');
    expect(raw.a[1]).toEqual('A');

    // set historic value does not work
    obj.a = [Date.now() - 5, 'B'];
    expect(obj.a).toEqual('A');
    expect(raw.a[1]).toEqual('A');

    // setting new value works
    obj.a = toTuple('B');
    expect(obj.a).toEqual('B');
    expect(raw.a[1]).toEqual('B');

    // set future value does not work immediately
    obj.a = [Date.now() + 5, 'C'];
    expect(obj.a).toEqual('B');
    expect(raw.a[1]).toEqual('B');

    await new Promise(res => setTimeout(res, 10));

    expect(obj.a).toEqual('C');
    expect(raw.a[1]).toEqual('C');
  });
});
