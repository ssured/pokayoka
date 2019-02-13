const MRPC = require('muxrpc');
const pull = require('pull-stream');
var ws = require('pull-ws');

const { api } = require('./protocol');

const nano = require('nano')('http://admin:admin@localhost:5984');
const { dbChangesSinceLive } = require('../../src/utils/pull');

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
        merge: function(database) {
          // const db = nano.use(database);
          return pull.map(request => ({
            ...request,
            ok: true,
          }));
        },
      });
      const serverStream = server.createStream();
      pull(clientStream, serverStream, clientStream);
    }).listen(9999);
  },
};
