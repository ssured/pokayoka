import { createContext, useContext, useMemo } from 'react';
import { SpotDB } from '../utils/spotdb';
import { SPOHub } from '../utils/spo-hub';
import { SPOStorage } from '../utils/spo-storage';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { SPOWs } from '../utils/spo-ws';
import { WrapAsync } from '../model/base';
import { subj, SPOShape } from '../utils/spo';
import {
  createObservable,
  UndefinedOrPartialSPO,
} from '../utils/spo-observable';
import { useAuthentication } from './authentication';
import { observable, runInAction } from 'mobx';

const spotDb = new SpotDB('pokayoka');

const hub = new SPOHub();
const storage = new SPOStorage(hub, spotDb);
const ws = new ReconnectingWebSocket(`ws://localhost:3000/spows`);
const server = new SPOWs(hub, ws);

const spo = createObservable<{
  [key: string]: User;
}>(hub);

const SPOContext = createContext(spo);

export const useRoot = () => {
  const auth = useAuthentication();
  return useContext(SPOContext)[
    (auth.authentication.ok && auth.authentication.name) || 'anonymous'
  ];
};

// export const useQuery = (query: Parameters<typeof spotDb.query>[0]) => {
//   return useMemo(() => {
//     const resultArray = observable.array<
//       ReturnType<typeof spotDb.query> extends AsyncIterableIterator<infer U>
//         ? U
//         : never
//     >([], { deep: false });
//     (async () => {
//       for await (const result of spotDb.query(query)) {
//         runInAction(() => resultArray.push(result));
//       }
//     })();
//     return resultArray;
//   }, []);
// };

// // export const useSubject =

// export const useModel = <T extends SPOShape, U>(
//   asyncFactory: (obj: SPOShape) => WrapAsync<T, U>,
//   id: string | subj
// ) => {
//   const shape = useContext(SPOContext);
//   const auth = useAuthentication();
//   const subj = [
//     'user',
//     (auth.authentication.ok && auth.authentication.name) || 'anonymous',
//   ].concat(id);
//   return useMemo(() => asyncFactory(shape.get(subj)), [
//     asyncFactory,
//     shape,
//     ...subj,
//   ]);
// };

// export const useAccount = () => useModel(AsyncUser, []);
