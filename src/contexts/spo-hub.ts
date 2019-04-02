import {
  createContext,
  useContext,
  useMemo,
  useState,
  useRef,
  useEffect,
} from 'react';
import { SpotDB } from '../utils/spotdb';
import { SPOHub } from '../utils/spo-hub';
import { SPOStorage } from '../utils/spo-storage';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { SPOWs } from '../utils/spo-ws';
import { WrapAsync, GraphableObj, Resolver } from '../SPO/model/base';
import { subj, get } from '../utils/spo';
import { createObservable } from '../utils/spo-observable';

const spotDb = new SpotDB('pokayoka');

const hub = new SPOHub();
const storage = new SPOStorage(hub, spotDb);
const ws = new ReconnectingWebSocket(`ws://localhost:3000/spows`);
const server = new SPOWs(hub, ws);

const SPOContext = createContext(createObservable(hub, ['server']));

export const useModel = <T extends GraphableObj, U>(
  asyncFactory: (resolver: any, subj: subj) => WrapAsync<T, U>,
  id: string | subj
) => {
  const shape = useContext(SPOContext);
  const subj = typeof id === 'string' ? [id] : id;

  const model = useMemo(() => asyncFactory(shape.get, subj), [shape, ...subj]);
  // useEffect(() => {
  //   return () => {
  //     model.destroy();
  //   };
  // }, [...subj]);
  return model;
};
