import { Storage } from '../storage/index';
import { MemoryAdapter } from '../storage/adapters/memory';
import { Store, referenceTo } from './index';
import { types as t, getSnapshot } from 'mobx-state-tree';

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
    const storage = new Storage(new MemoryAdapter());
    let tuplesCount = 0;
    storage.subscribe(() => (tuplesCount += 1));

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

    await store.commit();
    expect(store.patches.length).toBe(0);
    await delay(10);
    expect(tuplesCount).toBe(1);

    expect(getSnapshot(rootStore.loadInstance(M, mroot.id)!)).toEqual({
      id: 'root',
      name: 'b',
    });
  });
});
