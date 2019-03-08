import { Storage } from '../storage/index';
import { MemoryAdapter } from '../storage/adapters/memory';
import { Store } from './index';

describe('Storage', () => {
  test('it loads', () => {
    expect(Store).toBeDefined();
    expect(Storage).toBeDefined();
    expect(MemoryAdapter).toBeDefined();
    const store = new Store(new Storage(new MemoryAdapter()));
    expect(store).toBeDefined();
  });
});
