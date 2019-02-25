import { createContext, useContext, useEffect, useState } from 'react';
import levelUp from 'levelup';
import encode from 'encoding-down';
import levelJs from 'level-js';
import charwise, { CharwiseKey } from 'charwise';

import { Partition } from '../utils/level';
import { IAnyModelType, Instance, SnapshotOut } from 'mobx-state-tree';
import pull, { drain } from 'pull-stream';
import createAbortable from 'pull-abortable';

import debug from 'debug';
import base, { filename } from 'paths.macro';
const log = debug(`${base}${filename}`);

const dbName = 'pokayoka';

const db = levelUp(
  encode(levelJs(dbName), {
    keyEncoding: charwise,
    valueEncoding: 'json',
  })
);

export const rootPartition = Partition.root(db);

export const LevelContext = createContext<Partition>(rootPartition);

export const useLevel = () => useContext(LevelContext);

export const useDoc = <T extends IAnyModelType>(type: T, key: CharwiseKey) => {
  const level = useLevel();
  const [doc, setDoc] = useState<null | Instance<T>>(null);

  useEffect(() => {
    // console.log('type, key', type, key, level.encode(key));
    const abortable = createAbortable();
    pull(
      // @ts-ignore
      level.source({ gte: key, lte: key, sync: false }),
      abortable,
      drain<{ key: CharwiseKey; value: SnapshotOut<T> }>(({ value }) => {
        if (type.is(value)) {
          if (doc && doc.merge) {
            doc.merge(value);
          } else {
            setDoc(type.create(value));
          }
        } else {
          log('doc %O is not of type %s', value, type.name);
        }
      })
    );
    return abortable.abort;
  }, [level, type, key]);

  return doc;
};
