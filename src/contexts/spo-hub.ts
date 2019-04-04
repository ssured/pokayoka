import { createContext, useContext, useMemo } from 'react';
import { SpotDB } from '../utils/spotdb';
import { SPOHub } from '../utils/spo-hub';
import { SPOStorage } from '../utils/spo-storage';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { SPOWs } from '../utils/spo-ws';
import { WrapAsync } from '../SPO/model/base';
import { subj, SPOShape } from '../utils/spo';
import { createObservable } from '../utils/spo-observable';
import createContainer from 'constate';
import { AsyncUser } from '../SPO/model/User';
import { useAuthentication } from './authentication';

const spotDb = new SpotDB('pokayoka');

const hub = new SPOHub();
const storage = new SPOStorage(hub, spotDb);
const ws = new ReconnectingWebSocket(`ws://localhost:3000/spows`);
const server = new SPOWs(hub, ws);

const SPOContext = createContext(createObservable(hub));

export const useModel = <T extends SPOShape, U>(
  asyncFactory: (obj: SPOShape) => WrapAsync<T, U>,
  id: string | subj
) => {
  const shape = useContext(SPOContext);
  const auth = useAuthentication();
  const subj = [
    'user',
    (auth.authentication.ok && auth.authentication.name) || 'anonymous',
  ].concat(id);
  return useMemo(() => asyncFactory(shape.get(subj)), [
    asyncFactory,
    shape,
    ...subj,
  ]);
};

export const useAccount = () => useModel(AsyncUser, []);
