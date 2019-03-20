import debug from 'debug';

import { ServerScope } from 'nano';
import MRPC from 'muxrpc';

import { dbChangesSinceLive, DbChangesSinceLiveOptions } from '../utils/pull';
import { serverManifest, clientManifest } from './shared';
import { ClientApi } from './client';
import { asyncMap } from 'pull-stream';
import { HAM_PATH } from '../mst-ham/index';
import { merge, THam } from '../mst-ham/merge';
import isEqualWith from 'lodash.isequalwith';

const log = debug(__filename.replace(__dirname, '~'));

export type UserProfile = { name: string; roles: string[] };

const serverImplementation = (nano: ServerScope, profile: UserProfile) => ({
  changesSince(name: string, options: DbChangesSinceLiveOptions = {}) {
    log.extend('changesSince')('%s %o %s', name, options, profile.name);
    return dbChangesSinceLive(nano, name, options);
  },
  remoteMerge(name: string) {
    type Doc = {
      _id: string;
      _rev?: string;
      [HAM_PATH]: [number, THam];
      [key: string]: any;
    };
    const db = nano.use<Doc>(name);
    return asyncMap(
      ({ key, value: incomingDoc }: { key: string; value: Doc }, cb) => {
        db.get(incomingDoc._id)
          .catch(
            err =>
              /** TODO handle 404 explicitly */ ({
                _id: incomingDoc._id,
                [HAM_PATH]: [0, {}],
              } as Doc)
          )
          // @ts-ignore
          .then(currentDoc => {
            const machineState = Date.now();
            const {
              _id,
              _rev,
              [HAM_PATH]: currentHam,
              ...currentValue
            } = currentDoc;
            const {
              _id: inId,
              _rev: inRev,
              [HAM_PATH]: incomingHam,
              ...incomingValue
            } = incomingDoc;
            delete incomingHam[1]._rev;
            delete currentHam[1]._rev;

            const {
              resultHam,
              resultValue,
              currentChanged,
              deferUntilState /** TODO implement deferred updates */,
            } = merge(
              machineState,
              incomingHam,
              incomingValue,
              currentHam,
              currentValue
            );

            console.log({
              merge: 'merge',
              name,
              incomingDoc,
              currentDoc,
              currentChanged,
              resultHam,
              resultValue,
            });

            if (
              !isEqualWith(currentHam, resultHam) ||
              !isEqualWith(currentValue, resultValue)
            ) {
              return db.insert({
                ...currentDoc,
                [HAM_PATH]: resultHam,
                ...resultValue,
                _id,
                _rev,
              });
            }
          })
          .then(
            () =>
              cb(null, {
                key,
                ok: true,
                value: incomingDoc,
              }),
            (err: any) =>
              cb(null, {
                key,
                ok: false,
                err,
              })
          );
      }
    );
  },
});

export type ServerApi = ReturnType<typeof serverImplementation>;

export const muxServer = (nano: ServerScope, profile: UserProfile) => {
  const result = MRPC(clientManifest, serverManifest)(
    serverImplementation(nano, profile)
  );
  return result as typeof result & ClientApi;
};
