import {
  ObjectStorage,
  StorableObject,
  StampedPatch,
  spoInObject,
} from './object';
import { MemoryAdapter } from './adapters/memory';
import { hash as h } from './hash';
import { types, onPatch, splitJsonPath, getSnapshot } from 'mobx-state-tree';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

describe('Object Storage', () => {
  test('it loads', () => {
    expect(ObjectStorage).toBeDefined();
    expect(MemoryAdapter).toBeDefined();
    const storage = new ObjectStorage(new MemoryAdapter());
    expect(storage).toBeDefined();
  });

  test('snapshots can be written and persisted', async () => {
    const mem = new MemoryAdapter();
    const storage = new ObjectStorage(mem);
    const obj = { id: 'test1', property: 'A' };
    await storage.slowlyMergeObject(obj).commitImmediately();
    expect(await storage.getObject(obj.id)).toEqual(obj);
  });
  test('snapshots can be written and persisted', async () => {
    const mem = new MemoryAdapter();
    const storage = new ObjectStorage(mem);
    const obj = {
      id: 'test2',
      reference: ['test1'] as [string],
    };
    await storage.slowlyMergeObject(obj).commitImmediately();
    expect(await storage.getObject(obj.id)).toEqual(obj);
  });
  test('snapshots can be written and persisted', async () => {
    const mem = new MemoryAdapter();
    const storage = new ObjectStorage(mem);
    const obj = { id: 'test3', property: { k: 'v' } };
    await storage.slowlyMergeObject(obj).commitImmediately();
    expect(await storage.getObject(obj.id)).toEqual(obj);
  });
  test('snapshots can be written and persisted', async () => {
    const mem = new MemoryAdapter();
    const storage = new ObjectStorage(mem);
    const obj = { id: 'test4', property: ['a', 'b'] };
    await storage.slowlyMergeObject(obj).commitImmediately();
    expect(await storage.getObject(obj.id)).toEqual(obj);
  });
  test('snapshots can be written and persisted', async () => {
    const mem = new MemoryAdapter();
    const storage = new ObjectStorage(mem);
    const obj: StorableObject = {
      id: 'test4',
      property: [{ a: 'A' }, { b: 'B' }, { c: 'C' }],
    };
    await storage.slowlyMergeObject(obj).commitImmediately();
    // compare where all arrays are treated as sets
    expect(h(await storage.getObject(obj.id, true), true)).toEqual(
      h(obj, true)
    );
  });
  test('snapshots can be written and persisted', async () => {
    const mem = new MemoryAdapter();
    const storage = new ObjectStorage(mem);
    const obj: StorableObject = {
      id: 'test5',
      property: [{ a: [{ a: 'A' }, { c: ['C'] }] }, 'B'],
    };
    await storage.slowlyMergeObject(obj).commitImmediately();
    // compare where all arrays are treated as sets
    expect(h(await storage.getObject(obj.id, true), true)).toEqual(
      h(obj, true)
    );
  });
  test('snapshots can be written and persisted', async () => {
    const mem = new MemoryAdapter();
    const storage = new ObjectStorage(mem);
    const obj: StorableObject = {
      id: 'test6',
      property: [],
      another: 'a',
    };
    await storage.slowlyMergeObject(obj).commitImmediately();
    // compare where all arrays are treated as sets
    expect(await storage.getObject(obj.id, true)).toEqual({
      id: 'test6',
      another: 'a',
    });
    // expect(
    //   (await mem.queryList({})).map(JSON.stringify as any).join('\n')
    // ).toEqual('');
  });

  test('snapshots are automatically merged', async () => {
    const mem = new MemoryAdapter();
    const storage = new ObjectStorage(mem);

    const obj1 = { id: 'test', a: 'A', b: 'b' };
    await storage.slowlyMergeObject(obj1).commitImmediately();
    const contentLength1 = (await mem.queryList({})).length;
    const logEntries1 = (await mem.queryList({
      gte: ['log'],
      lt: ['log', undefined],
    })).length;
    expect(logEntries1).toBe(2);

    const obj2 = { id: 'test', b: 'B' };
    await storage.slowlyMergeObject(obj2).commitImmediately();
    const contentLength2 = (await mem.queryList({})).length;
    const logEntries2 = (await mem.queryList({
      gte: ['log'],
      lt: ['log', undefined],
    })).length;
    expect(logEntries2).toBe(3);

    const result = await storage.getObject(obj1.id);
    expect(result).toEqual({ ...obj1, ...obj2 });

    // only 2 props are stored, which means the old data is correctly removed
    expect(contentLength1 + logEntries2 - logEntries1).toBe(contentLength2);
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
    let storage = new ObjectStorage(new MemoryAdapter(), () => state);

    storage.slowlyMergeObject(obj1);
    storage.slowlyMergeObject(obj2);
    await storage.commit();

    // because
    expect(obj1.b > obj2.b).toBe(true);
    // obj2 is ignored, as they are both written in the same state
    expect(await storage.getObject(obj1.id)).toEqual(expectedResultAtSameState);

    // start again and increment the state between writes
    storage = new ObjectStorage(new MemoryAdapter(), () => state);

    await storage.slowlyMergeObject(obj1).commitImmediately();
    state = nextState;
    await storage.slowlyMergeObject(obj2).commitImmediately();

    expect(await storage.getObject(obj1.id)).toEqual(expectedResultAtNextState);
  });

  test('patches can be written', async () => {
    const storage = new ObjectStorage(new MemoryAdapter());

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
    onPatch(instance, patch => {
      storage.mergePatches([
        { ...patch, path: splitJsonPath(patch.path), s: [id] },
      ]);
      storage.commit();
    });

    // @ts-ignore
    storage.slowlyMergeObject(getSnapshot(instance));
    await storage.commit();

    expect(await storage.getObject(id)).toEqual({
      id,
      name: 'Pokayoka',
      address: { street: 'A1' },
    });

    instance.setName('Pokayoka BV');
    await delay(50);

    expect(await storage.getObject(id)).toEqual({
      id,
      name: 'Pokayoka BV',
      address: { street: 'A1' },
    });

    instance.setStreet('A2');
    await delay(50);

    expect(await storage.getObject(id)).toEqual({
      id,
      name: 'Pokayoka BV',
      address: { street: 'A2' },
    });
  });

  test('patches can replace objects', async () => {
    const mem = new MemoryAdapter();
    const storage = new ObjectStorage(mem);

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
    onPatch(instance, patch => {
      storage.mergePatches([
        { ...patch, path: splitJsonPath(patch.path), s: [id] },
      ]);
      storage.commit();
    });

    await storage.slowlyMergeObject(getSnapshot(instance)).commitImmediately();

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
    const storage = new ObjectStorage(mem);

    const obj1 = { id: 'obj1', key: 'value' };
    const inv1 = { id: 'inv1', ref1: [obj1.id] };
    const inv2 = {
      id: 'inv2',
      ref1: [obj1.id],
      ref2: [obj1.id],
    };

    storage.slowlyMergeObject(obj1);
    storage.slowlyMergeObject(inv1);
    storage.slowlyMergeObject(inv2);
    await storage.commit();

    expect(await storage.getInverse(obj1)).toEqual({
      ref1: [[inv1.id], [inv2.id]],
      ref2: [[inv2.id]],
    });

    expect(await storage.getInverse(obj1, 'ref2')).toEqual({
      ref2: [[inv2.id]],
    });
  });

  test('written patches are emitted', async () => {
    // TODO should be emitting patch objects
    const mem = new MemoryAdapter();
    const storage = new ObjectStorage(mem);

    const tuples: StampedPatch[] = [];
    const unsubscribe = storage.subscribe(written => {
      console.log(written);
      tuples.push(...written);
    });

    const obj1 = { id: 'obj1', key: 'value' };
    await storage.slowlyMergeObject(obj1).commitImmediately();
    await delay(10);
    unsubscribe();

    expect(tuples.length).toBe(1);
  });

  test('spoInObject', () => {
    const scenarios: { args: any[]; out: any[] }[] = [
      { args: [['obj'], {}], out: [] },

      {
        args: [['obj'], { a: 'A' }],
        out: [{ s: ['obj'], p: 'a', o: 'A' }],
      },

      {
        args: [['obj'], { a: 'A', b: 'B' }],
        out: [{ s: ['obj'], p: 'a', o: 'A' }, { s: ['obj'], p: 'b', o: 'B' }],
      },

      {
        args: [['obj'], { a: 'A', b: { c: 'C' } }],
        out: [
          { s: ['obj'], p: 'a', o: 'A' },
          { s: ['obj', 'b'], p: 'c', o: 'C' },
        ],
      },

      {
        args: [['obj'], { set: ['a'] }],
        out: [
          {
            s: ['obj'],
            p: 'set',
            o: ['a'],
          },
        ],
      },

      {
        args: [['obj'], { set: ['a', { b: 'B' }] }],
        out: [
          {
            s: ['obj', 'set[]'],
            p: h(['obj', 'set', 0, 'a']),
            o: 'a',
          },
          {
            s: ['obj', 'set[]', h(['obj', 'set', 1, { b: 'B' }])],
            p: 'b',
            o: 'B',
          },
        ],
      },

      {
        args: [['obj'], { set: [{ a: 'A' }, { b: 'B' }] }],
        out: [
          {
            s: ['obj', 'set[]', h(['obj', 'set', 0, { a: 'A' }])],
            p: 'a',
            o: 'A',
          },
          {
            s: ['obj', 'set[]', h(['obj', 'set', 1, { b: 'B' }])],
            p: 'b',
            o: 'B',
          },
        ],
      },
    ];

    expect.assertions(scenarios.length);

    for (const { args, out } of scenarios) {
      expect([...spoInObject.apply(null, args.concat('now') as any)]).toEqual(
        out.map(item => ({
          ...item,
          t: 'now',
        }))
      );
    }
  });
});
