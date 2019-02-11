import { api } from '../../server/mux/protocol';
import MRPC from 'muxrpc';
import pull from 'pull-stream';
import pullWs from 'pull-ws';
// import debounce from 'pull-debounce';
// import tee from 'pull-tee';
import pl from 'pull-level';
import levelUp from 'levelup';
import encode from 'encoding-down';
import levelJs from 'level-js';
import charwise from 'charwise';
// import sub from 'subleveldown';
import { tap } from 'pull-tap';
import mux from '@expo/mux';
import flatMap from 'pull-flatmap';
import paraMap from 'pull-paramap';

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
      const server = 'localhost:5984-uniq-id';
      const key = `seq-${server}-${db}`;

      const indexedDbKeyFromProject = projectId => `project-${projectId}`;

      const level = levelUp(
        encode(levelJs(indexedDbKeyFromProject(db)), {
          keyEncoding: charwise,
          valueEncoding: 'json',
        })
      );
      const store = {
        doc(doc) {
          // the actual documents
          return {
            key: ['doc', typeof doc === 'string' ? doc : doc._id],
            value: doc,
          };
        },
        lastSeq(server, seq) {
          // maximum retrieved seq number, per connected server
          return { key: ['last_seq', server], value: seq };
        },
        jobs: {
          addtoCache(url, info) {
            // maximum retrieved seq number, per connected server
            return { key: ['jobs', 'add_to_cache', url], value: info };
          },
        },
      };

      // process add_to_cache jobs for Db
      pull(
        pl.read(level, {
          gte: ['jobs', 'add_to_cache'],
          lte: ['jobs', 'add_to_cache!'],
          live: true,
        }),
        pull.filter(({ value }) => !!value),
        paraMap(
          ({ key, value }, cb) =>
            caches
              .open(db)
              .then(cache =>
                cache.add(
                  new Request(key[2] /* = url*/, { credentials: 'include' })
                )
              )
              .then(
                // when succeeded, remove the job
                () => cb(null, { key, value: null }),
                // if failed, write back into level
                () =>
                  cb(null, {
                    key,
                    value: { ...value, tries: (value.tries || 0) + 1 },
                  })
              ),
          5, // 5 parallel downloads
          false // order is not important
        ),
        tap(console.log),
        pl.write(level, { windowSize: 5, windowTime: 100 })
      );

      level
        .get(store.lastSeq(server).key)
        .catch(e => 0) // if not known, start from 0. idempotent because server = truth
        .then(since => {
          console.log({ since });
          pull(
            client.changesSince(db, {
              since,
              include_docs: true,
            }),
            pull.filter(({ sync }) => !sync), // ignore the in-sync marker
            // tee(
            //   // keep track of the latest seq seen in the stream, useful for restarting
            //   pull(
            //     debounce(50), // debounce as we do not need to write all intermediate values
            //     pull.map(({ seq }) => ({
            //       key: store.lastSeq(server),
            //       value: seq,
            //     })),
            //     pl.write(level, { windowSize: 1, windowTime: 1 })
            //   )
            // ),
            // tee(
            //   // buffer attachments in cache
            //   pull(
            //     debounce(50), // debounce as we do not need to write all intermediate values
            //     pull.map(({ seq }) => ({
            //       key: store.lastSeq(server),
            //       value: seq,
            //     })),
            //     pl.write(level, { windowSize: 1, windowTime: 1 })
            //   )
            // ),
            muxMap(({ doc, seq }) =>
              [
                store.doc(doc),
                store.lastSeq(server, seq) /*store.index.byTitle(doc)*/,
              ].concat(
                Object.entries(doc._attachments || {}).map(
                  ([filename, fileinfo]) =>
                    store.jobs.addtoCache(
                      `http://localhost:5984/${db}/${doc._id}/${filename}`,
                      fileinfo
                    )
                )
              )
            ),
            flatMap(ops => ops),
            pull.filter(op => !!op), // remove empty items
            pl.write(level, { windowSize: 100, windowTime: 100 })
          );
        });

      // send data to server
      pull(pull.values([1, 2, 3]), client.log());

      console.log('done onconnect');
    },
  });
};
