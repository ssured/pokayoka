import levelup from 'levelup';
import levelJs from 'level-js';
import encode from 'encoding-down';
import charwise from 'charwise';
import { SharedAdapter, StorageAdapter, KeyType, ValueType } from './shared';

export class WebAdapter extends SharedAdapter implements StorageAdapter {
  constructor(public name: string) {
    super();
    this.level = levelup(
      encode<KeyType, ValueType>(levelJs(name), {
        keyEncoding: charwise,
        valueEncoding: 'json',
      })
    );
  }
}
