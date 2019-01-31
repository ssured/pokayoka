import React, { createContext, useContext } from 'react';
import PouchDB from 'pouchdb';
import { useLocalStorage } from 'react-use';
import { generateId } from '../utils/id';
import { useToken } from './authentication';

export const PouchDBContext = createContext<{
  local: PouchDB.Database;
  remote: PouchDB.Database;
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
    <PouchDBContext.Provider value={{ local, remote }}>
      {children}
    </PouchDBContext.Provider>
  );
};

export const usePouchDB = () => useContext(PouchDBContext);
