import { useState, useEffect } from 'react';
import { IAnyModelType, Instance, SnapshotIn } from 'mobx-state-tree';
import { useDoc } from '../contexts/pouchdb';

export const useModel: <T extends IAnyModelType>(
  Model: T,
  db: PouchDB.Database,
  id: string
) => Instance<T> | null = (Model, db, id) => {
  const doc = useDoc<SnapshotIn<typeof Model>>(db, id);
  const [instance, setInstance] = useState<Instance<typeof Model> | null>(
    /*cache.has(id) ? Model.create(cache.get(id)) : */ null
  );

  useEffect(
    () => {
      if (doc == null) return;
      if (instance == null) {
        setInstance(Model.create(doc, { db }));
      } else {
        // instance.merge(doc);
      }
      return () => {
        if (instance) {
          // cache.set(getIdentifier(instance), getSnapshot(instance));
          instance.destroy();
        }
      };
    },
    [doc]
  );

  return instance;
};
