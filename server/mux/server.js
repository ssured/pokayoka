const MRPC = require('muxrpc');
const pull = require('pull-stream');
const ws = require('pull-ws');
const defer = require('pull-defer');
const toStream = require('pull-stream-to-stream');

const PouchDB = require('pouchdb');
const replicationStream = require('./pouchdb-replication-stream');
PouchDB.plugin(replicationStream.plugin);
PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);

var MemoryStream = require('memorystream');

const { api } = require('./protocol');

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
        dbReplicationStream: function(name, since = 'now') {
          const source = defer.source();

          var dumpedString = '';
          var stream = new MemoryStream();
          stream.on('data', function(chunk) {
            dumpedString += chunk.toString();
          });
          const db = new PouchDB(
            `http://admin:admin@localhost:5984/${name}`,
            {}
          );

          db.dump(stream, { since: 0 })
            .then(() => console.log('dump', dumpedString))
            .catch(err => console.error(err));

          return pull.values([1, { a: 'A' }, 3, 4, 5]);
        },
      });
      const serverStream = server.createStream();
      pull(clientStream, serverStream, clientStream);
    }).listen(9999);
  },
};
