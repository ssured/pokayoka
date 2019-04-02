import levelup from 'levelup';
import leveldown from 'leveldown';
import encode from 'encoding-down';
import charwise from 'charwise';
import { KeyType, ValueType } from '../../src/storage/adapters/shared';

import path from 'path';

export const level = levelup(
  encode<KeyType, ValueType>(
    leveldown(path.join(__dirname, '../../pokayokadb')),
    {
      keyEncoding: charwise,
      valueEncoding: 'json',
    }
  )
);
