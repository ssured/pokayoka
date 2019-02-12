const { encodeDecodeForPath } = require('./helpers');

describe('helper: encodeDecodeForPath', () => {
  test('it generates an encode+decode pair for a path', () => {
    const { encode, decode } = encodeDecodeForPath(['a', 'b']);

    expect(encode('c')).toEqual(['a', ['b', ['c']]]);
    expect(decode(['a', ['b', ['c']]])).toBe('c');
  });
});
