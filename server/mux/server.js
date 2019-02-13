const MRPC = require('muxrpc');
const pull = require('pull-stream');

var ws = require('pull-ws');

const { api } = require('./protocol');

const nano = require('nano')('http://admin:admin@localhost:5984');
const { dbChangesSinceLive } = require('../../src/utils/pull');

const { merge } = require('../../src/mst-ham/merge');
const { HAM_PATH } = require('../../src/mst-ham/index');

// var b = server.createStream();
// // or subscribe to the 'closed' event
// b.once('closed', console.log.bind(console, 'stream is closed'));

module.exports = {
  startServer: () => {
    ws.createServer(clientStream => {
      //pass the api into the constructor, and then pass the object you are wrapping
      //(if there is a local api)
      var server = MRPC(null, api)({
        hello: function(name, cb) {
          cb(null, 'hello, ' + name + '!');
        },
        stuff: function() {
          return pull.values([1, { a: 'A' }, 3, 4, 5]);
        },
        changesSince: function(name, options = {}) {
          // console.log('changesSince', name, options);
          // return pull.values([{ name, options }]);
          return dbChangesSinceLive(nano, name, options);
        },
        log: function() {
          console.log('HIER');
          return pull.drain(
            item => console.log('mux log', item),
            () => console.log('mux log ended')
          );
        },
        merge: function() {
          return pull.asyncMap((request, cb) => {
            const { doc: incomingDoc, databaseName } = request.value;
            const db = nano.use(databaseName);
            console.log('yo hier');
            db.get(incomingDoc._id)
              .catch(err => /** TODO handle 404 explicitly */ ({
                _id: incomingDoc._id,
                [HAM_PATH]: [0, {}],
              }))
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
                  databaseName,
                  request,
                  currentDoc,
                  currentChanged,
                  resultHam,
                  resultValue,
                });

                if (currentChanged) {
                  return db.insert({
                    ...currentDoc,
                    [HAM_PATH]: resultHam,
                    ...resultValue,
                    _id,
                    _rev,
                    _attachments: undefined,
                  });
                }
              })
              .then(
                () =>
                  cb(null, {
                    key: request.key,
                    ok: true,
                  }),
                err =>
                  cb(null, {
                    key: request.key,
                    ok: false,
                    err: err,
                  })
              );
          });
        },
      });
      const serverStream = server.createStream();
      pull(clientStream, serverStream, clientStream);
    }).listen(9999);
  },
};
