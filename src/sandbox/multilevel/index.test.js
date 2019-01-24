const multilevel = require('multilevel/msgpack');
const levelup = require('levelup');
const memdown = require('memdown');
const pl = require('pull-level');
const pull = require('pull-stream');
const createAbortable = require('pull-abortable');
const encode = require('encoding-down');
const liveStream = require('level-live-stream');
const sublevel = require('level-sublevel');
const createManifest = require('level-manifest');
const MRPC = require('muxrpc');

const live = (db, opts = {}) => {
  const abortable = createAbortable();

  return {
    stream: pull(pl.read(db, { live: true, sync: false, ...opts }), abortable),
    abort: abortable.abort,
  };
};

describe('multilevel', () => {
  test('it works', async () => {
    const serverDb = levelup(encode(memdown(), { valueEncoding: 'json' }));
    const serverStream = multilevel.server(serverDb);

    const db = multilevel.client();
    serverStream.pipe(db.createRpcStream()).pipe(serverStream);

    await db.put('data', 'value');

    // wait for next runloop
    await new Promise(r => setTimeout(r, 0));

    expect(await serverDb.get('data')).toEqual('value');
  });

  test('server writes create client events', async () => {
    const serverDb = levelup(encode(memdown(), { valueEncoding: 'json' }));

    const api = {
      live: 'source',
    };

    const server = MRPC(null, api)({
      live: (opts = {}) =>
        pl.read(serverDb, { live: true, sync: false, ...opts }),
    });
    const client = MRPC(api, null)();

    const serverStream = server.createStream();
    pull(serverStream, client.createStream(), serverStream);

    const data = [];

    pull(client.live(), pull.drain(datum => data.push(datum)));
    await new Promise(r => setTimeout(r, 0));

    expect(data.length).toBe(0);
    await serverDb.put('key', 'value');

    await new Promise(r => setTimeout(r, 1));
    expect(data.length).toBe(1);
  });
});
