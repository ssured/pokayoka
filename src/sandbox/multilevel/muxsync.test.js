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
const index = require('level-index');
const pify = require('pify');

const live = (db, opts = {}) => {
  const abortable = createAbortable();

  return {
    stream: pull(pl.read(db, { live: true, sync: false, ...opts }), abortable),
    abort: abortable.abort,
  };
};

describe('multilevel', () => {
  test('server writes create client events', async () => {
    const serverDb = levelup(encode(memdown(), { valueEncoding: 'json' }));
    const sublevelServerDb = sublevel(serverDb);

    const api = {
      read: 'source',
      write: 'sink',
    };

    const server = MRPC(null, api)({
      read: (sub, opts = {}) =>
        pl.read(sublevelServerDb.sublevel(sub), {
          live: true,
          sync: false,
          ...opts,
        }),
      write: sub => pl.write(sublevelServerDb.sublevel(sub)),
    });
    const client = MRPC(api, null)();

    // setup duplex
    const serverStream = server.createStream();
    pull(serverStream, client.createStream(), serverStream);

    const db = levelup(encode(memdown(), { valueEncoding: 'json' }));
    const sdb = sublevel(db);

    let machineState = Date.now();
    const getMachineState = () => machineState++;

    const state = sdb.sublevel('state');
    sdb.pre((ch, add) =>
      add({
        key: ch.key,
        value: getMachineState(),
        type: 'put',
        prefix: state,
      })
    );

    // should use reduce here, as index does not support mutating data
    const byTime = index(state, 'byTime', (key, value, emit) =>
      emit(value, key)
    );

    const changes = (since = 0) =>
      pull(
        pl.read(byTime, { gte: since }),
        pull.asyncMap(async ({ value }, cb) =>
          sdb.get(value, (err, data) => cb(err, { key: value, value: data }))
        )
      );

    const put = pify(sdb.put);
    await put('test1', 'data1');
    await put('test2', 'data2');
    await put('test2', 'data3');

    // sync changes to the server
    pull(changes(), client.write('data'));

    // wait for the sync to complete
    // todo expose progress
    await new Promise(r => setTimeout(r, 100));

    // check that the data arrived on the server
    const serverData = sublevelServerDb.sublevel('data');
    const get = pify(serverData.get);

    expect(await get('test1')).toEqual('data1');
    expect(await get('test2')).toEqual('data3');
  });
});
