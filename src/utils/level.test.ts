import { Partition } from './level';

describe('Partition - provides simple level key partitioning', () => {
  test('it exposes root', () => {
    const root = Partition.root();
    expect(root).toBeDefined();

    expect(root.encode('key')).toEqual('key');
    expect(root.decode(root.encode('key'))).toEqual('key');
  });

  test('it partitions', () => {
    const root = Partition.root();
    const sub = root.partition('sub');

    expect(sub.encode('key')).toEqual(['sub', 'key']);
    expect(sub.decode(sub.encode('key'))).toEqual('key');

    const subsub = sub.partition('subsub');

    expect(subsub.encode('key')).toEqual(['sub', ['subsub', 'key']]);
    expect(subsub.decode(subsub.encode('key'))).toEqual('key');

    const subsubsub = subsub.partition('subsubsub');

    expect(subsubsub.encode('key')).toEqual([
      'sub',
      ['subsub', ['subsubsub', 'key']],
    ]);
    expect(subsubsub.decode(subsubsub.encode('key'))).toEqual('key');
  });

  test('it allows for complex keys', () => {
    const root = Partition.root();
    const sub = root.partition(['sub', undefined]);

    expect(sub.encode('key')).toEqual([['sub', undefined], 'key']);
    expect(sub.decode(sub.encode('key'))).toEqual('key');

    expect(sub.encode(['key', null])).toEqual([
      ['sub', undefined],
      ['key', null],
    ]);
    expect(sub.decode(sub.encode(['key', null]))).toEqual(['key', null]);
  });
});
