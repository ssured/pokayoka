import { set, get } from 'idb-keyval';

import { EventHub } from './eventhub';

import {
  ProtocolV1,
  isMessage,
  AskMessageType,
  TellMessageType,
} from '../../server/protocolv1';

import { ensureNever } from '../utils';
import { merge } from '../mst-ham/merge';
const machineState = () => Date.now();
const PREFIX = 'huh';

const frontend = new EventHub<ProtocolV1>();
{
  // wire Worker IN and OUT to frontend (main) thread
  // in
  const ctx: Worker = self as any;
  ctx.addEventListener('message', ({ data }) => {
    if (isMessage(data)) {
      console.log(`worker received <-- client`, data);
      frontend.fire(data);
    }
  });
  // out
  frontend.subscribe(message => {
    console.log('worker sent --> client', message);
    ctx.postMessage(message);
  });
}

const server = new EventHub<ProtocolV1>();
{
  // wire Worker IN and OUT to server over a websocket
  // in
  const ws = new WebSocket('ws://localhost:3000/abcd');
  ws.addEventListener('open', () => {
    ws.addEventListener('message', ({ data }) => {
      try {
        const message = JSON.parse(data);
        if (isMessage(message)) {
          console.log('worker received <-- server', message);
          server.fire(message);
        }
      } catch (e) {
        console.error(`Received wrong data over WS, ${data}, ${e}`);
      }
    });

    server.subscribe(message => ws.send(JSON.stringify(message)));
  });
}

const worker = new EventHub<ProtocolV1>();
worker.connect(frontend);
worker.connect(server);

// implement workerIn => indexedDb
worker.subscribe(message => {
  switch (message.type) {
    case AskMessageType:
      get(PREFIX + message.id)
        .then(doc => {
          worker.fire({
            type: TellMessageType,
            doc: {
              _id: message.id,
              ...doc,
            },
          });
        })
        .catch(e => console.error(`Worker AskMessage Error ${e.message}`));
      break;
    case TellMessageType:
      const _id = message.doc._id;
      get(PREFIX + _id)
        .catch(() => {})
        .then(maybeCurrent => {
          const current = maybeCurrent || { _id, '#': [0, {}] };
          const { resultHam, resultValue, currentChanged } = merge(
            machineState(),
            message.doc['#'],
            message.doc,
            (current as any)['#'],
            current
          );
          if (currentChanged) {
            const newDoc = {
              ...resultValue,
              '#': resultHam,
            };
            return set(PREFIX + _id, newDoc);
          }
        })
        .catch(e => {
          debugger;
          console.error(`Worker TellMessage Error ${e.message}`);
        });
      break;
    default:
      ensureNever(message, false);
  }
});
