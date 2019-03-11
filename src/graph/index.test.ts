import { Storage } from '../storage/index';
import { MemoryAdapter } from '../storage/adapters/memory';
import { Store, referenceTo } from './index';
import { types as t, getSnapshot } from 'mobx-state-tree';
import console = require('console');

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

describe('Storage', () => {
  test('it loads', () => {
    expect(Store).toBeDefined();
    expect(Storage).toBeDefined();
    expect(MemoryAdapter).toBeDefined();
    const store = new Store(new Storage(new MemoryAdapter()));
    expect(store).toBeDefined();
  });

  test('can store a reference', async () => {
    const rootStore = new Store(new Storage(new MemoryAdapter()));

    const M: any = t
      .model('M', {
        id: t.identifier,
        ma: t.maybeNull(referenceTo(t.late(() => M))),
      })
      .actions(self => ({
        setMa(ma: any) {
          self.ma = ma;
        },
      }));

    const store = rootStore.record();

    const mroot = store.newInstance(M, { id: 'root' });
    expect(mroot.id).toBeDefined();
    expect(store.patches.length).toBe(1);

    mroot.setMa(store.newInstance(M, { id: 'sub' }));
    expect(store.patches.length).toBe(3);

    await store.commit();

    expect(getSnapshot(rootStore.loadInstance(M, mroot.id))).toEqual({
      id: 'root',
      ma: 'sub',
    });
  });

  test('compresses patches', async () => {
    const mem = new MemoryAdapter();
    const storage = new Storage(mem);
    let tuplesCount = 0;
    storage.subscribe(tuple => {
      console.log(tuple);
      tuplesCount += 1;
    });

    const rootStore = new Store(storage);

    const M = t
      .model('M', {
        id: t.identifier,
        name: t.string,
      })
      .actions(self => ({
        setName(name: string) {
          self.name = name;
        },
      }));

    const store = rootStore.record();
    const mroot = store.newInstance(M, { id: 'root', name: 'a' });

    expect(tuplesCount).toBe(0);
    expect(store.patches.length).toBe(1);
    mroot.setName('b');
    expect(store.patches.length).toBe(2);
    mroot.setName('c');
    expect(store.patches.length).toBe(3);

    await store.commit();
    expect(store.patches.length).toBe(0);
    await delay(10);
    expect(tuplesCount).toBe(1);

    expect(getSnapshot(rootStore.loadInstance(M, mroot.id)!)).toEqual({
      id: 'root',
      name: 'c',
    });
  });

  test('really stores stuff', async () => {
    const db = new MemoryAdapter();
    const rootStore = new Store(new Storage(db));

    const M = t.model('M', {
      id: t.identifier,
      key: 'value',
    });

    const store = rootStore.record();
    const obj = store.newInstance(M, { id: 'root' });
    await store.commit();

    expect(getSnapshot(rootStore.loadInstance(M, obj.id)!)).toEqual({
      id: 'root',
      key: 'value',
    });

    // test if the same data is available when loaded from another storage

    const newStore = new Store(new Storage(db));
    newStore.loadInstance(M, obj.id);
    await delay(10);
    expect(getSnapshot(newStore.loadInstance(M, obj.id)!)).toEqual({
      id: 'root',
      key: 'value',
    });
  });
});
