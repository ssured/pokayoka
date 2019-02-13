const Backoff = require('./backoff');

describe('Exponential backoff', () => {
  test('it increments on calls', () => {
    const backoff = new Backoff();
    expect(backoff.current).toBe(0);

    backoff.fail();
    expect(backoff.current).toBe(100);

    backoff.fail();
    expect(backoff.current).toBe(200);

    backoff.fail();
    expect(backoff.current).toBe(400);

    backoff.fail();
    expect(backoff.current).toBe(800);

    backoff.fail();
    expect(backoff.current).toBe(1600);

    backoff.fail();
    expect(backoff.current).toBe(2000);

    backoff.fail();
    expect(backoff.current).toBe(2000);

    backoff.success();
    expect(backoff.current).toBe(0);
  });
});
