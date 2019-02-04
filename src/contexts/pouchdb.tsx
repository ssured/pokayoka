import React, { createContext, useContext, useState, useEffect } from 'react';
import PouchDB from 'pouchdb';
import { useLocalStorage } from 'react-use';
import { generateId } from '../utils/id';
import { useToken } from './authentication';

export const PouchDBContext = createContext<{
  local: PouchDB.Database;
  remote: PouchDB.Database;
  name: string;
} | null>(null);

export const ConnectPouchDB: React.FunctionComponent<{ dbname: string }> = ({
  dbname,
  children,
}) => {
  const [pouchdbName] = useLocalStorage(`dbmap-${dbname}`, generateId());
  const token = useToken();

  const local = new PouchDB(pouchdbName, {
    auto_compaction: true,
    adapter: 'idb',
  });

  const remote = new PouchDB(`http://localhost:5984/${dbname}`, {
    adapter: 'http',
    // ajax: { timeout: 60e3 },
    auth: {
      username: token,
      password: token,
    },
  });

  return (
    <PouchDBContext.Provider value={{ local, remote, name: dbname }}>
      {children}
    </PouchDBContext.Provider>
  );
};

export const usePouchDB = () => useContext(PouchDBContext)!;

export const useSync = (
  local: PouchDB.Database<{}>,
  remote: PouchDB.Database<{}>,
  options: PouchDB.Replication.SyncOptions = {}
) => {
  const [
    lastPullChange,
    setPullChange,
  ] = useState<PouchDB.Replication.ReplicationResult<{}> | null>(null);
  const [
    lastPushChange,
    setPushChange,
  ] = useState<PouchDB.Replication.ReplicationResult<{}> | null>(null);
  const [paused, setPaused] = useState<string | boolean>(false);
  const [active, setActive] = useState<boolean>(true);
  const [lastDenied, setDenied] = useState<{} | null>(null);
  const [lastError, setError] = useState<{} | null>(null);
  const [complete, setComplete] = useState<
    PouchDB.Replication.SyncResultComplete<{}> | false
  >(false);

  const [maxPullPending, setMaxPullPending] = useState(-Infinity);
  const [maxPushPending, setMaxPushPending] = useState(-Infinity);

  const pullPending =
    (lastPullChange && (lastPullChange as any).pending) || -Infinity;
  const pushPending =
    (lastPushChange && (lastPushChange as any).pending) || -Infinity;

  if (pullPending > maxPullPending) {
    setMaxPullPending(
      pullPending + (lastPullChange ? lastPullChange.docs_read : 0)
    );
  }
  if (pushPending > maxPushPending) {
    setMaxPushPending(
      pushPending + (lastPushChange ? lastPushChange.docs_read : 0)
    );
  }

  const pullProgress: number | false =
    maxPullPending > 0 && pullPending >= 0
      ? Math.round((100 * (maxPullPending - pullPending)) / maxPullPending)
      : false;
  const pushProgress: number | false =
    maxPushPending > 0 && pushPending >= 0
      ? Math.round((100 * (maxPushPending - pushPending)) / maxPushPending)
      : false;

  const progress: number | false =
    pullProgress === false && pushProgress === false
      ? false
      : pullProgress === false
      ? pushProgress
      : pushProgress === false
      ? pullProgress
      : Math.round(
          (100 *
            (maxPullPending - pullPending + maxPushPending - pushPending)) /
            (maxPullPending + maxPushPending)
        );

  useEffect(
    () => {
      let alive = true;
      const sync = PouchDB.sync(local, remote, {
        live: true,
        retry: true,
        ...options,
        // batch_size: 3, // FIXME lower on tiny devices
        // batches_limit: 3,
      })
        .on('change', info => {
          if (!alive) return;
          info.direction === 'pull'
            ? setPullChange(info.change)
            : setPushChange(info.change);
        })
        .on('paused', (err: {}) => {
          if (!alive) return;
          setPaused(err ? JSON.stringify(err) : true);
          setActive(false);
        })
        .on('active', () => {
          if (!alive) return;
          setPaused(false);
          setActive(true);
        })
        .on('denied', err => {
          if (!alive) return;
          setDenied(err);
        })
        .on('complete', info => {
          if (!alive) return;
          setComplete(info);
        })
        .on('error', err => {
          if (!alive) return;
          setError(err);
        });

      return () => {
        alive = false;
        sync.cancel();
      };
    },
    [local, remote]
  );

  return {
    lastPushChange,
    lastPullChange,
    paused,
    active,
    lastDenied,
    lastError,
    complete,
    pullProgress,
    pushProgress,
    progress,
  };
};

export const useDoc = <T extends {} = {}>(
  db: PouchDB.Database<{}>,
  id: string | null | undefined,
  options: PouchDB.Core.ChangesOptions = { live: true }
) => {
  const [doc, setDoc] = useState<T | null | undefined>(undefined);

  useEffect(
    () => {
      if (id == null) return;
      const feed = db
        .changes({
          include_docs: true,
          doc_ids: [id],
          ...options,
        })
        .on('change', change => setDoc((change.doc as unknown) as T))
        .on('error', () => setDoc(null));
      return () => {
        console.log('useDoc cancel', db, id);
        feed.cancel();
      };
    },
    [db.name, id, JSON.stringify(options)]
  );

  return doc;
};

export const useAttachment = (
  db: PouchDB.Database<{}>,
  id: string,
  attName: string | null
) => {
  const [src, setSrc] = useState<string | null | undefined>(undefined);
  const doc = useDoc<{
    _attachments: { [attname: string]: { digest: string } };
  }>(db, attName == null ? null : id);

  useEffect(
    () => {
      if (doc == null || attName == null) return;
      let alive = true;

      db.getAttachment(id, attName)
        .then(blob => {
          if (src) URL.revokeObjectURL(src);
          if (alive) {
            setSrc(URL.createObjectURL(blob));
          }
        })
        .catch(() => {
          if (alive) {
            setSrc(null);
          }
        });
      return () => {
        alive = false;
        if (src) URL.revokeObjectURL(src);
      };
    },
    [
      doc &&
        attName &&
        doc._attachments &&
        doc._attachments[attName] &&
        doc._attachments[attName].digest,
    ]
  );

  return src;
};
