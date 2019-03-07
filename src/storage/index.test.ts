import { Storage } from './index';
import { MemoryAdapter } from './adapters/memory';

describe('Storage', () => {
  test('it loads', () => {
    expect(Storage).toBeDefined();
    expect(MemoryAdapter).toBeDefined();
    const storage = new Storage(new MemoryAdapter());
    expect(storage).toBeDefined();
  });

  test('snapshots can be written and persisted', async () => {
    const mem = new MemoryAdapter();
    const storage = new Storage(mem);

    const obj = { id: 'test', a: 'A' };
    await storage.writeRawSnapshot(obj);

    expect(await storage.getRawSnapshot(obj.id)).toEqual(obj);
    // expect(
    //   (await mem.queryList({})).map(JSON.stringify as any).join('\n')
    // ).toEqual('');
  });

  test('snapshots are automatically merged', async () => {
    const mem = new MemoryAdapter();
    const storage = new Storage(mem);

    const obj1 = { id: 'test', a: 'A', b: 'b' };
    await storage.writeRawSnapshot(obj1);
    const contentLength1 = (await mem.queryList({})).length;

    const obj2 = { id: 'test', b: 'B' };
    await storage.writeRawSnapshot(obj2);
    const contentLength2 = (await mem.queryList({})).length;

    const result = await storage.getRawSnapshot(obj1.id);
    expect(result).toEqual({ ...obj1, ...obj2 });

    // only 2 props are stored, which means the old data is correctly removed
    expect(contentLength1).toBe(contentLength2);

    // expect(
    //   (await mem.queryList({})).map(JSON.stringify as any).join('\n')
    // ).toEqual('');
  });

  test('snapshots are automatically merged', async () => {
    const mem = new MemoryAdapter();
    const storage = new Storage(mem);

    const obj1 = { id: 'test', a: 'A', b: 'b' };
    await storage.writeRawSnapshot(obj1);
    const contentLength1 = (await mem.queryList({})).length;

    const obj2 = { id: 'test', b: 'B' };
    await storage.writeRawSnapshot(obj2);
    const contentLength2 = (await mem.queryList({})).length;

    const result = await storage.getRawSnapshot(obj1.id);
    expect(result).toEqual({ ...obj1, ...obj2 });

    // only 2 props are stored, which means the old data is correctly removed
    expect(contentLength1).toBe(contentLength2);

    // expect(
    //   (await mem.queryList({})).map(JSON.stringify as any).join('\n')
    // ).toEqual('');
  });
});
