const levelup = require('levelup');
const memdown = require('memdown');
const pl = require('pull-level');
const pull = require('pull-stream');
const encode = require('encoding-down');

const sub = require('subleveldown');
const asyncMap = require('pull-stream/throughs/async-map');
const AutoIndex = require('level-auto-index');
const charwise = require('charwise');
const pify = require('pify');

// const mst = require('../mst-ham/index');

let machineState = Date.now();
const getMachineState = () => '' + machineState++;

describe('sublevel with index', () => {
  test('indexes state', async () => {
    const db = levelup(encode(memdown()));

    const opts = {
      keyEncoding: charwise,
      valueEncoding: 'json',
    };

    const data = sub(db, 'data', opts);
    const idx = {
      machineState: sub(db, 'machineState', opts),
    };

    const getState = doc => [getMachineState()];

    data.byMachineState = AutoIndex(data, idx.machineState, getState);

    const api = pify(data);

    await api.put(['yo'], 'dude1');
    await api.put('yo2', 'dude2');

    const lastServerSync = getMachineState();

    await api.put(['yo'], 'dude updated');
    await api.put('yo3', { dude: 'dude3' });

    const changesSince = since =>
      pull(
        pl.read(idx.machineState, { gte: [since] }),
        asyncMap(async ({ value }, cb) =>
          data.get(value, (err, data) => cb(err, { key: value, value: data }))
        )
      );

    pull(
      changesSince(lastServerSync),
      pull.collect((err, data) => {
        console.log(data);
        expect(data.length).toBe(2);
      })
    );

    db.createReadStream().on('data', data => {
      console.log(data);
    });

    await new Promise(r => setTimeout(r, 100));
  });
});
