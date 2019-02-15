import { types as t, addDisposer, getSnapshot, onPatch } from 'mobx-state-tree';
import nano from 'nano';

import WebSocket from 'ws';
import express from 'express';

import { WEBSOCKET_HEARTBEAT_INTERVAL_MS } from '../src/constants';
import { when, observable, reaction } from 'mobx';
import { ensureNever, isEqual } from '../src/utils';
import { generateId } from '../src/utils/id';

import {
  ProtocolV1,
  ID,
  ACK,
  AskMessageType,
  TellMessageType,
  isMessage,
} from './protocolv1';

import { merge, HamValue } from '../src/mst-ham/merge';
import { currentState } from '../src/global';
import { HAM_PATH } from '../src/mst-ham';

const server = nano('http://localhost:5984');

const serializeCommand = (obj: ProtocolV1) =>
  JSON.stringify({ [ID]: generateId(), ...obj });

export const parseMessage = (message: string): ProtocolV1 | null => {
  try {
    const command = JSON.parse(message);
    if (isMessage(command)) return command;
  } catch (e) {}
  return null;
};

const socketIds = new WeakMap<WebSocket, string>();
const getId = (ws: WebSocket): string => {
  if (!socketIds.has(ws)) {
    socketIds.set(ws, generateId());
  }
  return socketIds.get(ws)!;
};

const upsert = async (
  db: nano.DocumentScope<{}>,
  doc: nano.IdentifiedDocument & nano.MaybeRevisionedDocument,
  lastKnownRev?: string
) => {
  const _rev =
    typeof lastKnownRev === 'string'
      ? lastKnownRev
      : (await db.get(doc._id).catch(() => ({} as nano.Document)))._rev;

  const newDoc = JSON.parse(JSON.stringify(doc));
  newDoc._rev = _rev;
  // the _rev will be updated, so the HAM has to be updated as well
  newDoc[HAM_PATH][1]._rev = currentState();

  try {
    await db.insert(newDoc);
    return;
  } catch (e) {
    if (e.statusCode === 409 && typeof lastKnownRev === 'string') {
      await upsert(db, doc);
      return;
    }
    console.log('upsert failed', e);
  }
};

const ProjectConnection = t
  .model('ProjectConnection', {
    id: t.identifier,
    info: t.optional(t.array(t.string), () => []),
    errors: t.optional(t.array(t.string), () => []),
    socketCount: t.optional(t.number, 0),
  })
  .volatile(() => ({
    sockets: observable.array<WebSocket>([]),
  }))
  .views(self => ({
    get db() {
      return server.use(self.id);
    },
  }))
  .actions(self => ({
    log(msg: string) {
      self.info.push(msg);
    },
  }))
  .actions(self => ({
    // tslint:disable-next-line function-name
    _registerError(err: Error | undefined | null) {
      if (err != null) {
        self.errors.push(
          JSON.stringify({
            message: err.message,
            name: err.name,
            stack: err.stack,
          })
        );
      }
    },
    flush() {
      self.info.splice(0);
      self.errors.splice(0);
    },
    unregisterWs(ws: WebSocket) {
      const idx = self.sockets.indexOf(ws);
      if (idx > -1) {
        self.sockets.splice(idx, 1);
      }
      self.log(`${getId(ws)}: unregister`);
    },
    updateSocketCount() {
      self.socketCount = self.sockets.length;
    },
  }))
  .actions(self => ({
    send(command: ProtocolV1, ...recipients: WebSocket[]) {
      const sockets = self.sockets.filter(
        ws => recipients.length === 0 || recipients.indexOf(ws) > -1
      );
      const message = serializeCommand(command);
      for (const ws of sockets) {
        ws.send(message, self._registerError);
      }
    },
  }))
  .actions(self => ({
    registerWs(ws: WebSocket) {
      self.sockets.push(ws);
      self.log(`${getId(ws)}: register`);

      ws.on('close', () => self.unregisterWs(ws));

      ws.on('message', async (message: string) => {
        const command = parseMessage(message);
        if (command == null) {
          console.log('server failed to understand', message);
          return;
        }

        switch (command.type) {
          case AskMessageType:
            console.log('server got ASK', command.id);
            try {
              const doc = await self.db.get(command.id);
              self.send({ doc, type: TellMessageType, [ACK]: command[ID] }, ws);
            } catch (e) {
              self._registerError(e);
            }
            break;

          case TellMessageType:
            try {
              console.log('server got TELL', command.doc);

              const current = await self.db
                .get(command.doc._id)
                .catch(() => undefined);

              if (current === undefined) {
                // console.log('UPSERT', command.doc);
                if (command.doc.type) {
                  await upsert(self.db, command.doc);
                }
                return;
              }

              const { [HAM_PATH]: inHam, ...inValue } = command.doc;
              const {
                [HAM_PATH]: curHam,
                ...curValue
              } = (current as unknown) as {
                [HAM_PATH]: HamValue;
                [key: string]: any;
              };

              const { resultHam, resultValue, currentChanged } = merge(
                currentState(),
                inHam,
                inValue,
                curHam,
                curValue
              );

              // console.log(
              //   JSON.stringify(
              //     {
              //       inHam,
              //       inValue,
              //       curHam,
              //       curValue,
              //       resultHam,
              //       resultValue,
              //       currentChanged,
              //     },
              //     null,
              //     2
              //   )
              // );

              if (currentChanged) {
                await upsert(self.db, {
                  ...resultValue,
                  [HAM_PATH]: resultHam,
                });
                // change listener will return back the updated doc, no need to tell
              } else if (!isEqual(current, command.doc)) {
                self.send(
                  { doc: current, type: TellMessageType, [ACK]: command[ID] },
                  ws
                );
              }
            } catch (e) {
              self._registerError(e);
            }
            break;
          default:
            // ensure the whole protocol is implemented
            ensureNever(command);
        }
      });

      addDisposer(self, () => ws.close(0, 'ProjectConnection pool was closed'));
    },
    onActivate() {
      try {
        const feed = self.db.follow({ since: 'now', include_docs: true });
        feed.on('change', ({ doc }) =>
          self.send({ doc, type: TellMessageType })
        );

        // FIXME it seems typings for follow are not complete
        // TEST if follow system indeed stops
        (feed as any).follow();
        addDisposer(self, () => (feed as any).stop());
      } catch (e) {
        console.error('onActivate', e);
      }
    },
  }))
  .actions(self => ({
    afterCreate() {
      addDisposer(self, when(() => self.sockets.length > 0, self.onActivate));
      addDisposer(
        self,
        reaction(
          () => self.sockets.length !== self.socketCount,
          self.updateSocketCount
        )
      );
    },
  }));

const connections = t
  .model('Root', {
    projects: t.map(ProjectConnection),
  })
  .actions(self => ({
    getOrCreateProject(id: string) {
      return self.projects.has(id)
        ? self.projects.get(id)
        : self.projects.put({ id });
    },
  }))
  .actions(self => ({
    addConnection(id: string, ws: WebSocket) {
      const project = self.getOrCreateProject(id)!;
      project.registerWs(ws);
    },
  }))
  .create({ projects: {} });

export const wsRouterFor = (wss: WebSocket.Server) => {
  const router = express.Router();

  let i = 0;
  setInterval(
    () => console.log(`${(i += 1) % 2 ? ' ' : ''}- ${i % 2 ? '' : ' '}${i}`),
    5000
  );

  router.ws('/debug', ws => {
    try {
      const snapshot = getSnapshot(connections);
      ws.send(JSON.stringify({ snapshot }));

      const disposer = onPatch(connections, patch => {
        if (ws.OPEN) {
          ws.send(JSON.stringify({ patch }));
        } else {
          disposer();
        }
      });
      ws.on('close', disposer);
    } catch (e) {
      console.error('/debug error', e);
    }
  });

  router.ws('/:id', (ws, req) => {
    connections.addConnection(req.params.id, ws);
  });

  {
    // detect and close broken connections
    // https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections
    // be sure to implement some client side heartbeat as well!
    const wsIsAlive = new Map<WebSocket, boolean>();
    function heartbeat(this: WebSocket) {
      wsIsAlive.set(this, true);
    }
    function noop() {}

    wss.on('connection', ws => {
      wsIsAlive.set(ws, true);
      ws.on('pong', heartbeat);
    });

    setInterval(() => {
      for (const ws of wss.clients) {
        if (wsIsAlive.get(ws) === false) {
          wsIsAlive.delete(ws);
          ws.terminate();
        } else {
          wsIsAlive.set(ws, false);
          ws.ping(noop);
        }
      }
    }, WEBSOCKET_HEARTBEAT_INTERVAL_MS);
  }

  return router;
};

/**
 * getWss function returns ws server
 */
// getWss().clients.forEach(ws => {
//   if (ws.readyState !== ws.OPEN) {
//     ws.terminate();
//     return;
//   }
//   ws.ping();
// });

// getWss().on('upgrade', (res) => {
//     console.log(`response: ${Object.keys(res)}`);
// });

// const broadcast = (data: any) => {
//   getWss().clients.forEach((ws) => ws.send(data));
// };
