const levelup = require('levelup');
const memdown = require('memdown');
const pl = require('pull-level');
const pull = require('pull-stream');
const createAbortable = require('pull-abortable');
const encode = require('encoding-down');

const sublevel = require('level-sublevel');
const index = require('level-index');
const asyncMap = require('pull-stream/throughs/async-map');

describe('learn sublevel db', () => {
  test('it works', async () => {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }));
    const sdb = sublevel(db);

    const data = sdb.sublevel('data');

    const state = data.sublevel('state');
    data.pre((ch, add) =>
      add({
        key: String(Date.now()),
        value: ch.key,
        type: 'put',
        prefix: state,
      })
    );

    await data.put('yo', 'dude');

    pull(
      pl.read(data),
      pull.collect((err, data) => {
        console.log(data);
      })
    );

    pull(
      pl.read(state),
      pull.collect((err, data) => {
        console.log(data);
      })
    );

    pull(
      pl.read(db),
      pull.collect((err, data) => {
        console.log(data);
      })
    );

    db.createKeyStream().on('data', data => {
      console.log(data);
    });

    await new Promise(r => setTimeout(r, 10));
  });

  test('it keeps an extra copy for syncing with the server', async () => {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }));
    const sdb = sublevel(db);

    const data = sdb.sublevel('data');

    const state = data.sublevel('state');

    const byTime = index(state, 'byTime', (key, value, emit) =>
      emit(value, key)
    );

    let machineState = Date.now();
    const getMachineState = () => machineState++;

    data.pre((ch, add) =>
      add({
        key: ch.key,
        value: getMachineState(),
        type: 'put',
        prefix: state,
      })
    );

    await data.put('yo', 'dude1');
    await data.put('yo2', 'dude2');

    const lastServerSync = getMachineState();

    await data.put('yo', 'dude updated');
    await data.put('yo3', JSON.stringify({ dude: 'dude3' }));

    pull(
      pl.read(data),
      pull.collect((err, data) => {
        console.log(data);
      })
    );

    pull(
      pl.read(state),
      pull.collect((err, data) => {
        console.log(data);
      })
    );

    pull(
      pl.read(byTime, { gte: lastServerSync }),
      pull.collect((err, data) => {
        expect(data.length).toBe(2);
        console.log(data);
      })
    );

    const sync = since =>
      pull(
        pl.read(byTime, { gte: since }),
        asyncMap(async ({ value }, cb) =>
          data.get(value, (err, data) => cb(err, { key: value, value: data }))
        ),
        pull.collect((err, data) => {
          expect(data.length).toBe(2);
          console.log(data);
        })
      );

    sync(lastServerSync);

    db.createKeyStream().on('data', data => {
      console.log(data);
    });

    await new Promise(r => setTimeout(r, 100));
  });
});
