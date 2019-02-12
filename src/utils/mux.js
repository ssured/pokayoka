import { api } from '../../server/mux/protocol';
import MRPC from 'muxrpc';
import pull from 'pull-stream';
import pullWs from 'pull-ws';
import debounce from 'pull-debounce';
import tee from 'pull-tee';
import pl from 'pull-level';
import levelUp from 'levelup';
import encode from 'encoding-down';
import levelJs from 'level-js';
import charwise from 'charwise';
// import sub from 'subleveldown';
// import { tap } from 'pull-tap';
import mux from '@expo/mux';
import flatMap from 'pull-flatmap';
// import paraMap from 'pull-paramap';

import { createSourceAndSinkFor } from './db-jobs/helpers';
import { provideServiceWorkerCaching } from './db-jobs/serviceworker-caching';

let client = null;

const muxMap = fn =>
  pull.asyncMap((data, cb) =>
    mux(fn(data)).then(result => cb(null, result), error => cb(error))
  );

export const getClient = () => client;

export const startClient = () => {
  if (client != null) return;
  pullWs.connect('ws://localhost:9999', {
    binary: true,
    onConnect: (err, stream) => {
      if (err) throw new Error(err);
      client = MRPC(api, null)(); //remoteApi, localApi
      const clientStream = client.createStream();
      pull(clientStream, stream, clientStream);
      console.log('PULL CONNECT');

      client.hello('world', function(err, value) {
        if (err) throw err;
        console.log(value);
        // hello, world!
      });

      // pull(client.stuff(), pull.log());
      // read changes from server
      const db = 'bk0wb0a7sz';
      const server = 'http://localhost:5984/';

      const indexedDbKeyFromProject = projectId => `project-${projectId}`;

      const dbName = indexedDbKeyFromProject(db);
      const level = levelUp(
        encode(levelJs(dbName), {
          keyEncoding: charwise,
          valueEncoding: 'json',
        })
      );

      const LAST_SEQ = ['last_seq'];
      const {
        startServiceWorkerCacheJobs,
        addToServiceWorkerCacheJobs,
      } = provideServiceWorkerCaching({
        ...createSourceAndSinkFor(level, ['jobs', 'add_to_cache']),
        cacheName: dbName,
      });
      const abortCacheJobs = startServiceWorkerCacheJobs();

      // sync documents
      level
        .get(LAST_SEQ)
        .catch(e => 0) // if not known, start from 0. idempotent because server = truth
        .then(since => {
          console.log({ since });
          pull(
            client.changesSince(db, {
              since,
              include_docs: true,
            }),
            pull.filter(({ sync }) => !sync), // ignore the in-sync marker
            tee([
              // keep track of the latest seq seen in the stream, useful for restarting
              pull(
                debounce(100), // debounce as we do not need to write all intermediate values
                pull.map(({ seq }) => ({
                  key: LAST_SEQ,
                  value: seq,
                })),
                pl.write(level, { windowSize: 1, windowTime: 1 })
              ),
              // make sure the attachment of the incoming document are added to the cache
              pull(
                flatMap(({ doc }) =>
                  Object.keys(doc._attachments || {}).map(filename =>
                    [server, db, doc._id, filename].join('/')
                  )
                ),
                addToServiceWorkerCacheJobs()
              ),
            ]),
            // muxMap(({ doc, seq }) => [{ key: doc._id, value: doc }]),
            // flatMap(ops => ops), // flatten stream
            // pull.filter(op => !!op), // remove empty items
            pull.map(({ doc, deleted }) => ({
              key: doc._id,
              value: doc,
              type: deleted ? 'del' : 'put',
            })),
            pl.write(level, { windowSize: 100, windowTime: 100 })
          );
        });

      // send data to server
      pull(pull.values([1, 2, 3]), client.log());

      console.log('done onconnect');
    },
  });
};
