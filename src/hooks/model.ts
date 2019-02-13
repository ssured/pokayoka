import { useState, useEffect } from 'react';
import {
  IAnyModelType,
  Instance,
  SnapshotIn,
  destroy,
  SnapshotOut,
  getSnapshot,
} from 'mobx-state-tree';
import { useDoc } from '../contexts/pouchdb';
import { merge, HamValue } from '../mst-ham/merge';
import { HAM_PATH } from '../mst-ham/index';
import { winningRev } from '../utils/pouchdb';
import { notifyUpdate } from '../global';

const getMachineState = () => Date.now();

const mergePouchDoc = <
  T extends { [HAM_PATH]: HamValue } & PouchDB.Core.IdMeta &
    PouchDB.Core.RevisionIdMeta,
  U extends { [HAM_PATH]: HamValue } & PouchDB.Core.IdMeta &
    PouchDB.Core.RevisionIdMeta
>(
  incoming: T,
  current: U
) => {
  if (incoming._id !== current._id) {
    throw new Error('cannot merge different documents');
  }
  const { resultHam, resultValue } = merge(
    getMachineState(),
    incoming['#'],
    incoming,
    current['#'],
    current
  );
  return {
    ...resultValue,
    [HAM_PATH]: resultHam,
    _rev: winningRev(incoming._rev, current._rev),
  };
};

const upsert = <
  T extends { [HAM_PATH]: HamValue } & PouchDB.Core.IdMeta &
    PouchDB.Core.RevisionIdMeta
>(
  db: PouchDB.Database,
  doc: T
) =>
  db.put(doc).catch(err => {
    if (err.status !== 409) throw err;

    return db
      .get(doc._id)
      .then(incoming => db.put(mergePouchDoc(incoming as any, doc)));
  });

export const useModel: <T extends IAnyModelType>(
  Model: T,
  db: PouchDB.Database,
  id: string
) => Instance<T> | null = (Model, db, id) => {
  const doc = useDoc<SnapshotIn<typeof Model>>(db, id);
  const [instance, setInstance] = useState<Instance<typeof Model> | null>(
    /*cache.has(id) ? Model.create(cache.get(id)) : */ null
  );

  useEffect(() => {
    if (doc == null) return;
    if (instance == null) {
      setInstance(
        Model.create(doc, {
          db,
          onSnapshot(snapshot: SnapshotOut<typeof Model>) {
            console.log('put snapshot', snapshot);
            notifyUpdate(snapshot);
            // upsert(db, snapshot).then(result => {
            //   instance && instance._setRev(result.rev);
            // });
          },
        })
      );
    } else {
      // console.log('will merge doc', doc);
      instance.merge(doc);
      // console.log(JSON.stringify(getSnapshot(instance), null, 2));
      // merge with the current doc
      // applySnapshot(instance, doc);
    }
    //   return () => {};
  }, [doc]);

  useEffect(() => {
    return () => {
      if (instance) {
        // cache.set(getIdentifier(instance), getSnapshot(instance));
        destroy(instance);
      }
    };
  }, []);

  return instance;
};
