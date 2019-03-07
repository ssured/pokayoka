import { Storage } from './index';
import { MemoryAdapter } from './adapters/memory';
import { types, getSnapshot, onPatch } from 'mobx-state-tree';
import { delay } from 'q';

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
    await storage.slowlyMergeRawSnapshot(obj);

    expect(await storage.getRawSnapshot(obj.id)).toEqual(obj);
    // expect(
    //   (await mem.queryList({})).map(JSON.stringify as any).join('\n')
    // ).toEqual('');
  });

  test('snapshots are automatically merged', async () => {
    const mem = new MemoryAdapter();
    const storage = new Storage(mem);

    const obj1 = { id: 'test', a: 'A', b: 'b' };
    await storage.slowlyMergeRawSnapshot(obj1);
    const contentLength1 = (await mem.queryList({})).length;

    const obj2 = { id: 'test', b: 'B' };
    await storage.slowlyMergeRawSnapshot(obj2);
    const contentLength2 = (await mem.queryList({})).length;

    const result = await storage.getRawSnapshot(obj1.id);
    expect(result).toEqual({ ...obj1, ...obj2 });

    // only 2 props are stored, which means the old data is correctly removed
    expect(contentLength1).toBe(contentLength2);

    // expect(
    //   (await mem.queryList({})).map(JSON.stringify as any).join('\n')
    // ).toEqual('');
  });

  test('snapshots handle conflicts', async () => {
    const obj1 = { id: 'test', a: 'A', b: 'b' };
    const obj2 = { id: 'test', b: 'B' };

    const initialState = 'a';
    const nextState = 'b';
    const expectedResultAtSameState = obj1;
    const expectedResultAtNextState = { ...obj1, ...obj2 };

    // test correct context of test
    expect(initialState < nextState).toBe(true);
    expect(expectedResultAtSameState).not.toEqual(expectedResultAtNextState);

    // run write at same state (is a conflict)
    let state = initialState;
    let storage = new Storage(new MemoryAdapter(), () => state);

    await storage.slowlyMergeRawSnapshot(obj1);
    await storage.slowlyMergeRawSnapshot(obj2);

    // because
    expect(obj1.b > obj2.b).toBe(true);
    // obj2 is ignored, as they are both written in the same state
    expect(await storage.getRawSnapshot(obj1.id)).toEqual(
      expectedResultAtSameState
    );

    // start again and increment the state between writes
    storage = new Storage(new MemoryAdapter(), () => state);

    await storage.slowlyMergeRawSnapshot(obj1);
    state = nextState;
    await storage.slowlyMergeRawSnapshot(obj2);

    expect(await storage.getRawSnapshot(obj1.id)).toEqual(
      expectedResultAtNextState
    );
  });

  test('patches can be written', async () => {
    const storage = new Storage(new MemoryAdapter());

    const Model = types
      .model({ id: types.identifier, name: types.string })
      .actions(self => ({
        setName(name: string) {
          self.name = name;
        },
      }));
    const id = 'id';
    const instance = Model.create({ id, name: 'Pokayoka' });
    onPatch(instance, patch => storage.mergePatches([{ ...patch, id }]));

    await storage.slowlyMergeRawSnapshot(getSnapshot(instance));

    expect(await storage.getRawSnapshot(id)).toEqual({ id, name: 'Pokayoka' });

    instance.setName('Pokayoka BV');
    await delay(10);

    expect(await storage.getRawSnapshot(id)).toEqual({
      id,
      name: 'Pokayoka BV',
    });
  });
});
