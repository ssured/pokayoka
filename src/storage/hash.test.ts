import { hash, disableCacheForTesting } from './hash';

disableCacheForTesting();

test('hash', () => {
  expect(hash('hello world')).toBe(
    '9ddefe4435b21d901439e546d54a14a175a3493b9fd8fbf38d9ea6d3cbf70826'
  );
  expect(hash('')).toBe(
    '12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126'
  );
  expect(hash(null)).toBe(
    '74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b'
  );
  // @ts-ignore
  expect(hash(null)).toBe(hash(undefined));
  expect(hash(null)).not.toBe(hash('null'));

  // make sure the weakmap cache is disabled
  expect(hash(null)).toBe(hash(null));
  expect(hash({ a: 'A' })).toBe(hash({ a: 'A' }));
  expect(hash(['a', 'A'])).toBe(hash(['a', 'A']));

  // Here is the special part, arrays are
  // treated as sets when second arg = true!
  expect(hash(['a', 'b'], true)).toBe(hash(['b', 'a'], true));

  expect(hash(['a', 'b'])).not.toBe(hash(['b', 'a']));
});
