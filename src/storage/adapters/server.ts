import levelup from 'levelup';
import leveldown from 'leveldown';
import encode from 'encoding-down';
import charwise from 'charwise';
import { SharedAdapter, StorageAdapter, KeyType, ValueType } from './shared';

export class ServerAdapter extends SharedAdapter implements StorageAdapter {
  constructor(public name: string) {
    super();
    this.level = levelup(
      encode<KeyType, ValueType>(leveldown(`./${name}.db`), {
        keyEncoding: charwise,
        valueEncoding: 'json',
      })
    );
  }
}
