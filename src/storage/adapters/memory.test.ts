import { MemoryAdapter } from './memory';

describe('MemoryAdapter', () => {
  test('it loads', () => {
    expect(MemoryAdapter).toBeDefined();
  });

  test('it stores and retrieves data', async () => {
    const adp = new MemoryAdapter();

    await adp.batch([
      { type: 'put', key: ['a'], value: 'testa' },
      { type: 'put', key: ['b'], value: 'testb' },
    ]);

    const all = await adp.queryList({});

    expect(all).toMatchSnapshot();
    expect(all.length).toBe(2);

    const data = [];
    for await (const { key, value } of adp.query({})) {
      data.push({ key, value });
    }

    expect(data).toMatchSnapshot();
    expect(data.length).toBe(2);
  });
});
