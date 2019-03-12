import { Storage, StampedPatch, spoInObject, StorableObject } from './index';
import { MemoryAdapter } from './adapters/memory';
import { types, getSnapshot, onPatch, splitJsonPath } from 'mobx-state-tree';
import { hash as h } from './hash';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

describe('Storage', () => {
  test('it loads', () => {
    expect(Storage).toBeDefined();
    expect(MemoryAdapter).toBeDefined();
    const storage = new Storage(new MemoryAdapter());
    expect(storage).toBeDefined();
  });

  test('snapshots can be written and persisted', async () => {
    {
      const mem = new MemoryAdapter();
      const storage = new Storage(mem);
      const obj = { id: 'test1', property: 'A' };
      await storage.slowlyMergeObject(obj);
      expect(await storage.getObject(obj.id)).toEqual(obj);
    }

    {
      const mem = new MemoryAdapter();
      const storage = new Storage(mem);
      const obj = {
        id: 'test2',
        reference: ['test1'] as [string],
      };
      await storage.slowlyMergeObject(obj);
      expect(await storage.getObject(obj.id)).toEqual(obj);
    }

    {
      const mem = new MemoryAdapter();
      const storage = new Storage(mem);
      const obj = { id: 'test3', property: { k: 'v' } };
      await storage.slowlyMergeObject(obj);
      expect(await storage.getObject(obj.id)).toEqual(obj);
    }

    {
      const mem = new MemoryAdapter();
      const storage = new Storage(mem);
      const obj = { id: 'test4', property: ['a', 'b'] };
      await storage.slowlyMergeObject(obj);
      expect(await storage.getObject(obj.id)).toEqual(obj);
    }

    {
      const mem = new MemoryAdapter();
      const storage = new Storage(mem);
      const obj: StorableObject = {
        id: 'test4',
        property: [{ a: 'A' }, { b: 'B' }, { c: 'C' }],
      };
      await storage.slowlyMergeObject(obj);
      // compare where all arrays are treated as sets
      expect(h(await storage.getObject(obj.id, true), true)).toEqual(
        h(obj, true)
      );
    }

    {
      const mem = new MemoryAdapter();
      const storage = new Storage(mem);
      const obj: StorableObject = {
        id: 'test4',
        property: [{ a: [{ a: 'A' }, { c: ['C'] }] }, 'B'],
      };
      await storage.slowlyMergeObject(obj);
      // compare where all arrays are treated as sets
      expect(h(await storage.getObject(obj.id, true), true)).toEqual(
        h(obj, true)
      );
    }
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
    onPatch(instance, patch =>
      storage.mergePatches([
        { ...patch, path: splitJsonPath(patch.path), s: [id] },
      ])
    );

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
    onPatch(instance, patch =>
      storage.mergePatches([
        { ...patch, path: splitJsonPath(patch.path), s: [id] },
      ])
    );

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
    const inv1 = { id: 'inv1', ref1: [obj1.id] };
    const inv2 = {
      id: 'inv2',
      ref1: [obj1.id],
      ref2: [obj1.id],
    };

    await storage.slowlyMergeObject(obj1);
    await storage.slowlyMergeObject(inv1);
    await storage.slowlyMergeObject(inv2);

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
    const storage = new Storage(mem);

    const tuples: StampedPatch[] = [];
    const unsubscribe = storage.subscribe(written => tuples.push(...written));

    const obj1 = { id: 'obj1', key: 'value' };
    await storage.slowlyMergeObject(obj1);
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

/**
 * writeTuple(s, p, o)   => atomair waar gemerged wordt is de o. Hoe kleiner, hoe fijnmaziger de merge, maar hoe meer tombstones zullen ontstaan in de database
 *
 * restricties op o:
 * arrays zijn niet strict in order
 * undefined is toestand nog onbekend (oftewel nog niet uit de database geladen)
 * null is leeg
 * elke aangemaakte s blijft forever ruimte innemen
 * s moet een map object zijn, kan geen set of primitve zijn
 *
 * om HAM uit te kunnen voeren
 * k:['tsp', t, s, p] v:[o] - wat is de historie/toekomst van elk tuple. mag verwijderd worden
 *  = op elk moment in de tijd kan één subject-predicate-object tuple bestaan
 *    in de tijd kan deze wel wijzigen
 *    sort reverse en limit 1 geeft geldende spo tuple
 *
 * opslag formaat:
 *
 * writeTuple("obj", "prop", "value")
 * ["obj"] "prop" "value"
 *
 * writeTuple("obj", "prop", {a: 'A', b: 'B'})
 * ["obj","prop"] "a" "A"
 * ["obj","prop"] "b" "B"
 *
 * writeTuple("obj", "prop", {a: 'A', b: {c: 'C'}})
 * ["obj","prop"] "a" "A"
 * ["obj","prop","b"] "c" "C"
 *
 *
 * Bij schrijf actie kunnen dezelfde tuples die moeten verwijderd worden en die weer
 *
 * writeTuple("obj", "prop", ["A", "B"])
 * + ["obj","prop"] [hash("A")] "A"
 * + ["obj","prop"] [hash("B")] "B"
 *
 * writeTuple("obj", "prop", [{b: 'B'}, "A"]) === writeTuple("obj", "prop", ["A", {b: 'B'}])
 * - valt weg tegen 3 ["obj","prop"] [hash("A")] "A"
 * - ["obj","prop"] [hash("B")] "B"
 * + valt weg tegen 1 ["obj","prop"] [hash("A")] "A"
 * + ["obj","prop"] [hash({b: 'B'})] "B"
 *
 * omdat 1 en 3 gelijk zijn, hoeven deze niet geschreven te worden in de hex database
 *
 *
 * in o kan een link gemaakt worden
 * ["other"] "link" ["obj"] betekent dat other.link === obj
 * ["other","b"] "link" ["obj","c"] betekent dat other.b.link === obj.c
 *
 *
 * elke [S,P,O] combinatie kan __sync__ uitgegeven worden als observable MOBX object of set
 * database gaat lezen en update te properties als deze binnengekomen zijn
 *
 * elk opgevraagd attribuut is initieel undefined, oftewel loading
 * geen waarde (of geen waarde meer) is null
 * anders is er een waarde
 *
 * na iedere mutatie moet het eerste object uit de s array geupdate worden in de database
 */

//  stable stringify
//  stable stringify van een [set], stringify alle elementen in de set, sorteer de set als array en stringify die array
