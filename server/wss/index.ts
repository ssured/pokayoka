import { Server } from 'http';
import WebSocket from 'ws';
import { StampedGetMessage, StampedPutMessage } from '../../src/utils/spo-hub';

import { subj, pred, objt, spoInObject } from '../../src/utils/spo';
import { AbstractIteratorOptions } from 'abstract-leveldown';
import { ensureNever } from '../../src/utils/index';

import { level, levelId, persist } from './level';
import { getMachineState } from './sync';
import console = require('console');

export type IdentificationMessage = {
  type: 'identification';
  databaseId: string;
  databaseState: string;
};

type IncomingMessage = StampedGetMessage | StampedPutMessage;
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

        switch (msg.type) {
          case 'get':
            {
              const { localState, subj, pred } = msg;
              const machineState = getMachineState();

              // we are requesting server data
              if (subj[0] === 'user' && subj[1]) {
                const user = subj[1];

                for (const tuple of spoInObject(['user', user], {
                  name: user,
                  projects: {
                    bk0wb0a7sz: ['bk0wb0a7sz'],
                    bg4g1l87dr: ['bg4g1l87dr'],
                    c5ucr60kzn: ['c5ucr60kzn'],
                  },
                })) {
                  send(ws, {
                    type: 'put',
                    tuple,
                    state: machineState,
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
                  tuple: [s, p, o],
                  state: t,
                  localState: machineState,
                });
              }
            }
            break;
          case 'put':
            {
              console.log('put', msg);
              const { tuple, state } = msg;
              if (state) {
                persist(tuple, state);
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
