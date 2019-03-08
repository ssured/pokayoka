import { Storage, StampedPatch } from './index';
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
      const obj = {
        id: 'test2',
        reference: ['test1'] as [string],
      };
      await storage.slowlyMergeObject(obj);
      expect(await storage.getObject(obj.id)).toEqual(obj);
    }

    {
      const obj = { id: 'test3', property: { k: 'v' } };
      await storage.slowlyMergeObject(obj);
      expect(await storage.getObject(obj.id)).toEqual(obj);
    }

    expect(() => {
      const obj = { id: 'test4', property: ['a', 'b'] };
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
      .model({
        id: types.identifier,
        name: types.string,
        address: types.model({ street: types.string }),
      })
      .actions(self => ({
        setName(name: string) {
          self.name = name;
        },
        setStreet(name: string) {
          self.address.street = name;
        },
      }));

    const id = 'id';
    const instance = Model.create({
      id,
      name: 'Pokayoka',
      address: { street: 'A1' },
    });
    onPatch(instance, patch => storage.mergePatches([{ ...patch, s: id }]));

    // @ts-ignore
    await storage.slowlyMergeObject(getSnapshot(instance));

    expect(await storage.getObject(id)).toEqual({
      id,
      name: 'Pokayoka',
      address: { street: 'A1' },
    });

    instance.setName('Pokayoka BV');
    await delay(10);

    expect(await storage.getObject(id)).toEqual({
      id,
      name: 'Pokayoka BV',
      address: { street: 'A1' },
    });

    instance.setStreet('A2');
    await delay(10);

    expect(await storage.getObject(id)).toEqual({
      id,
      name: 'Pokayoka BV',
      address: { street: 'A2' },
    });
  });

  test('patches can replace objects', async () => {
    const mem = new MemoryAdapter();
    const storage = new Storage(mem);

    const Model = types
      .model({
        id: types.identifier,
        address: types.model({
          street: types.string,
          number: types.maybeNull(types.number),
        }),
      })
      .actions(self => ({
        setAddress(address: { street: string; number?: number }) {
          self.address = { number: null, ...address };
        },
      }));

    const id = 'id';
    const instance = Model.create({
      id,
      address: { street: 'A1', number: 1 },
    });
    onPatch(instance, patch => storage.mergePatches([{ ...patch, s: id }]));

    await storage.slowlyMergeObject(getSnapshot(instance));

    expect(await storage.getObject(id)).toEqual({
      id,
      address: { street: 'A1', number: 1 },
    });

    instance.setAddress({ street: 'A2' });
    await delay(10);

    expect(await storage.getObject(id)).toEqual(getSnapshot(instance));
  });

  test('inverse relations are exposed', async () => {
    const mem = new MemoryAdapter();
    const storage = new Storage(mem);

    const obj1 = { id: 'obj1', key: 'value' };
    const inv1 = { id: 'inv1', ref1: [obj1.id] as [string] };
    const inv2 = {
      id: 'inv2',
      ref1: [obj1.id] as [string],
      ref2: [obj1.id] as [string],
    };

    await storage.slowlyMergeObject(obj1);
    await storage.slowlyMergeObject(inv1);
    await storage.slowlyMergeObject(inv2);

    // expect(
    //   (await mem.queryList({})).map(JSON.stringify as any).join('\n')
    // ).toEqual('');

    expect(await storage.getInverse(obj1.id)).toEqual({
      ref1: [inv1.id, inv2.id],
      ref2: [inv2.id],
    });
  });

  test('written patches are emitted', async () => {
    // TODO should be emitting patch objects
    const mem = new MemoryAdapter();
    const storage = new Storage(mem);

    const tuples: StampedPatch[] = [];
    const unsubscribe = storage.subscribe(written => tuples.push(...written));

    const obj1 = { id: 'obj1', key: 'value' };
    await storage.slowlyMergeObject(obj1);
    unsubscribe();

    expect(tuples.length).toBe(1);
  });
});
