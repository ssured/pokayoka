import levelup from 'levelup';
import memdown from 'memdown';
import encode from 'encoding-down';
import charwise from 'charwise';
import { SharedAdapter, StorageAdapter, KeyType, ValueType } from './shared';

export class MemoryAdapter extends SharedAdapter implements StorageAdapter {
  constructor() {
    super();
    this.level = levelup(
      encode<KeyType, ValueType>(memdown(), {
        keyEncoding: charwise,
        valueEncoding: 'json',
      })
    );
  }
}
