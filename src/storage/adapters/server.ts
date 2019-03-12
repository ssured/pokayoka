import levelup from 'levelup';
import leveldown from 'leveldown';
import encode from 'encoding-down';
import charwise from 'charwise';
import { SharedAdapter, StorageAdapter, KeyType, ValueType } from './shared';

export class ServerAdapter extends SharedAdapter implements StorageAdapter {
  constructor(public path: string) {
    super();
    this.level = levelup(
      encode<KeyType, ValueType>(leveldown(path), {
        keyEncoding: charwise,
        valueEncoding: 'json',
      })
    );
  }
}
