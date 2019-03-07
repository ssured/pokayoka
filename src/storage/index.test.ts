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

    {
      const obj = { id: 'test1', property: 'A' };
      await storage.slowlyMergeObject(obj);
      expect(await storage.getObject(obj.id)).toEqual(obj);
    }

    {
      const obj = { id: 'test2', reference: ['test1'] };
      await storage.slowlyMergeObject(obj);
      expect(await storage.getObject(obj.id)).toEqual(obj);
    }

    expect(() => {
      const obj = { id: 'test3', property: { k: 'v' } };
      storage.slowlyMergeObject(obj as any);
    }).toThrowError('cannot write objects in graph');

    expect(() => {
      const obj = { id: 'test3', property: ['a', 'b'] };
      storage.slowlyMergeObject(obj as any);
    }).toThrowError('cannot write arrays in graph, except subject references');

    // expect(
    //   (await mem.queryList({})).map(JSON.stringify as any).join('\n')
    // ).toEqual('');
  });

  test('snapshots are automatically merged', async () => {
    const mem = new MemoryAdapter();
    const storage = new Storage(mem);

    const obj1 = { id: 'test', a: 'A', b: 'b' };
    await storage.slowlyMergeObject(obj1);
    const contentLength1 = (await mem.queryList({})).length;

    const obj2 = { id: 'test', b: 'B' };
    await storage.slowlyMergeObject(obj2);
    const contentLength2 = (await mem.queryList({})).length;

    const result = await storage.getObject(obj1.id);
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

    await storage.slowlyMergeObject(obj1);
    await storage.slowlyMergeObject(obj2);

    // because
    expect(obj1.b > obj2.b).toBe(true);
    // obj2 is ignored, as they are both written in the same state
    expect(await storage.getObject(obj1.id)).toEqual(expectedResultAtSameState);

    // start again and increment the state between writes
    storage = new Storage(new MemoryAdapter(), () => state);

    await storage.slowlyMergeObject(obj1);
    state = nextState;
    await storage.slowlyMergeObject(obj2);

    expect(await storage.getObject(obj1.id)).toEqual(expectedResultAtNextState);
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
    onPatch(instance, patch => storage.mergePatches([{ ...patch, s: [id] }]));

    await storage.slowlyMergeObject(getSnapshot(instance));

    expect(await storage.getObject(id)).toEqual({ id, name: 'Pokayoka' });

    instance.setName('Pokayoka BV');
    await delay(10);

    expect(await storage.getObject(id)).toEqual({
      id,
      name: 'Pokayoka BV',
    });
  });

  test('inverse relations are exposed', async () => {
    const mem = new MemoryAdapter();
    const storage = new Storage(mem);

    const obj1 = { id: 'obj1' };
    const ref: [string] = [obj1.id];
    const inv1 = { id: 'inv1', ref1: ref };
    const inv2 = { id: 'inv2', ref1: ref, ref2: ref };

    await storage.slowlyMergeObject(obj1);
    await storage.slowlyMergeObject(inv1);
    await storage.slowlyMergeObject(inv2);

    expect(await storage.getInverse(obj1.id)).toEqual({
      id: obj1.id,
      ref1: [inv1.id, inv2.id],
      ref2: [inv2.id],
    });
  });
});
