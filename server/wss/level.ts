import levelup from 'levelup';
import leveldown from 'leveldown';
import encode from 'encoding-down';
import charwise, { CharwiseKey } from 'charwise';

import { JsonEntry } from '../../src/utils/json';
export type KeyType = CharwiseKey;
export type ValueType = JsonEntry;

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
