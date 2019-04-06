import { Server } from 'http';
import WebSocket from 'ws';
import { StampedGetMessage, StampedPutMessage } from '../../src/utils/spo-hub';

import { subj, pred, objt, spoInObject } from '../../src/utils/spo';
import { AbstractIteratorOptions } from 'abstract-leveldown';
import { ensureNever } from '../../src/utils/index';

import { level, levelId, persist } from './level';
import { getMachineState } from './sync';
import console = require('console');

type IdentificationMessage = {
  type: 'identification';
  databaseId: string;
  databaseState: string;
};

// request to push all tuples since a known state
// in chronological order
type TuplesSinceState = {
  type: 'tuplessince';
  state: string;
};

export type IncomingMessage =
  | StampedGetMessage
  | StampedPutMessage
  | TuplesSinceState;
export type OutgoingMessage =
  | StampedGetMessage
  | StampedPutMessage
  | IdentificationMessage;

function send(ws: WebSocket, msg: OutgoingMessage) {
  ws.send(JSON.stringify(msg));
}

export async function registerWssServer(server: Server) {
  const databaseId = await levelId();

  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws, req) => {
    console.log('cookie', req.headers.cookie);

    // send database id to client
    send(ws, {
      type: 'identification',
      databaseId,
      databaseState: getMachineState(),
    });

    ws.on('message', async message => {
      try {
        const msg = JSON.parse(message.toString()) as IncomingMessage;
        // console.log(`WS ${msg.type}: ${message}`);

        const machineState = getMachineState();

        switch (msg.type) {
          case 'get':
            {
              const { subj, pred } = msg;

              // we are requesting server data
              if (subj[0] === 'user' && subj[1]) {
                const user = subj[1];

                for (const tuple of spoInObject(
                  ['user', user],
                  {
                    name: user,
                    projects: {
                      bk0wb0a7sz: ['bk0wb0a7sz'],
                    },
                  },
                  machineState
                )) {
                  send(ws, {
                    type: 'put',
                    tuple,
                    localState: machineState,
                  });
                }
                return;
              }

              const options: AbstractIteratorOptions = {};

              if (pred) {
                options.gte = options.lte = ['sp', subj, pred];
              } else {
                options.gte = ['sp', subj];
                options.lt = ['sp', [...subj, undefined]];
              }

              for await (const data of level.createReadStream(options)) {
                const {
                  key: [_, s, p],
                  value: [o, t],
                } = (data as unknown) as {
                  key: ['sp', subj, pred];
                  value: [objt, string];
                };

                send(ws, {
                  type: 'put',
                  tuple: [s, p, o, t],
                  localState: machineState,
                });
              }
            }
            break;
          case 'put':
            {
              persist(msg.tuple);
            }
            break;

          case 'tuplessince':
            {
              const since = msg.state;
              for await (const data of level.createReadStream({
                gte: ['log', since],
                lt: ['log', undefined],
              })) {
                const {
                  key: [_0, machineState, s, p, t],
                  value: [o],
                } = (data as unknown) as {
                  key: ['log', string, subj, pred, string];
                  value: [objt];
                };

                send(ws, {
                  type: 'put',
                  tuple: [s, p, o, t],
                  localState: machineState,
                });
              }
            }
            break;
          default:
            ensureNever(msg);
        }
      } catch (e) {
        console.log('Failed to process: %s', message, e);
      }
    });

    // ws.send('something');
  });
}
