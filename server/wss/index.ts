import { Server } from 'http';
import WebSocket from 'ws';
import { StampedGetMessage, StampedPutMessage } from '../../src/utils/spo-hub';

import levelup from 'levelup';
import leveldown from 'leveldown';
import encode from 'encoding-down';
import charwise from 'charwise';
import { KeyType, ValueType } from '../../src/storage/adapters/shared';

import mlts from 'monotonic-lexicographic-timestamp';

import path from 'path';
import { subj, pred, objt } from '../../src/utils/spo';
import { AbstractIteratorOptions } from 'abstract-leveldown';
import { ensureNever } from '../../src/utils/index';

const getMachineState = mlts();

const level = levelup(
  encode<KeyType, ValueType>(
    leveldown(path.join(__dirname, '../../pokayokadb')),
    {
      keyEncoding: charwise,
      valueEncoding: 'json',
    }
  )
);

type Message = StampedGetMessage | StampedPutMessage;

export function registerWssServer(server: Server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', ws => {
    ws.on('message', async message => {
      try {
        const msg = JSON.parse(message.toString()) as Message;
        console.log(`WS ${msg.type}: ${message}`);

        switch (msg.type) {
          case 'get':
            {
              const { localState, subj, pred } = msg;
              const machineState = getMachineState();

              const options: AbstractIteratorOptions = {};

              if (pred) {
                options.gte = options.lte = ['spo', subj, pred];
              } else {
                options.gte = ['spo', subj];
                options.lt = ['spo', [...subj, undefined]];
              }

              for await (const data of level.createReadStream(options)) {
                const {
                  key: [_, s, p],
                  value: [o, t],
                } = (data as unknown) as {
                  key: ['spo', subj, pred];
                  value: [objt, string];
                };

                ws.send(
                  JSON.stringify({
                    type: 'put',
                    tuple: [s, p, o],
                    state: t,
                  })
                );
              }
            }
            break;
          case 'put':
            {
              const {
                tuple: [s, p, o],
                state: tupleState,
                localState,
              } = msg;
              const t = tupleState || localState;
              const machineState = getMachineState();

              await level.batch([
                { type: 'put', key: ['spt', s, p, t], value: [o] },
                {
                  type: 'put',
                  key: ['log', machineState, s, p, o, t],
                  value: true,
                },
                {
                  type: 'put',
                  key: ['spo', s, p],
                  value: [o, t, machineState],
                },
                { type: 'put', key: ['pso', p, s, o], value: true },
                { type: 'put', key: ['ops', o, p, s], value: true },
                { type: 'put', key: ['sop', s, o, p], value: true },
                { type: 'put', key: ['osp', o, s, p], value: true },
                { type: 'put', key: ['pos', p, o, s], value: true },
              ]);
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
