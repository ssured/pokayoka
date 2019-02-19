import { createContext, useContext } from 'react';
import levelUp from 'levelup';
import encode from 'encoding-down';
import levelJs from 'level-js';
import charwise from 'charwise';

import { Partition } from '../utils/level';

const dbName = 'pokayoka';

const db = levelUp(
  encode(levelJs(dbName), {
    keyEncoding: charwise,
    valueEncoding: 'json',
  })
);

export const LevelContext = createContext<Partition>(Partition.root(db));

export const useLevel = () => useContext(LevelContext);
