import { createContext, useContext, useMemo } from 'react';
import { SpotDB } from '../utils/spotdb';
import { SPOHub } from '../utils/spo-hub';
import { SPOStorage } from '../utils/spo-storage';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { SPOWs } from '../utils/spo-ws';
import { WrapAsync, GraphableObj, Resolver } from '../SPO/model/base';
import { subj } from '../utils/spo';
import { createObservable } from '../utils/spo-observable';

const spotDb = new SpotDB('pokayoka');

const hub = new SPOHub();
const storage = new SPOStorage(hub, spotDb);
const ws = new ReconnectingWebSocket(`ws://localhost:3000/spows`);
const server = new SPOWs(hub, ws);

const SPOContext = createContext<Resolver>(
  (subj: subj) => createObservable(hub, subj).object as any
);

export const useModel = <T extends GraphableObj, U>(
  asyncFactory: (resolver: Resolver, subj: subj) => WrapAsync<T, U>,
  id: string
) => {
  const resolver = useContext(SPOContext);
  return useMemo(() => asyncFactory(resolver, [id]), [resolver, id]);
};
