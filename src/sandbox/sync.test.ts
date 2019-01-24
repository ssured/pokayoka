import pull, { asyncMap, collect } from 'pull-stream';

import levelup from 'levelup';
import memdown from 'memdown';
import encode from 'encoding-down';

import pl from 'pull-level';
import sub from 'subleveldown';
import AutoIndex from 'level-auto-index';
import * as charwise from 'charwise';
import pify from 'pify';
import { string } from 'prop-types';

let machineState = Date.now();
const getMachineState = () => {
  machineState += 1;
  return String(machineState);
};

describe('sublevel with index', () => {
  test('indexes state', async () => {
    const db = levelup(encode<any, any>(memdown()));

    const opts = {
      keyEncoding: charwise,
      valueEncoding: 'json',
    };

    const data = sub(db, 'data', opts);

    const idx = {
      machineState: sub(db, 'machineState', {
        ...opts,
        valueEncoding: opts.keyEncoding,
      }),
    };

    const getState = (doc: unknown) => [getMachineState()];

    const dataByMachineState = AutoIndex(data, idx.machineState, getState);

    const api = pify(data);

    await api.put(['yo'], 'dude1');
    await api.put('yo2', 'dude2');

    const lastServerSync = getMachineState();

    await api.put(['yo'], 'dude updated');
    await api.put('yo3', { dude: 'dude3' });

    pull(
      pl.read(dataByMachineState, { gte: [lastServerSync] }),
      collect((err: any, data: { key: any; value: any }[]) => {
        console.log(data);
        expect(data.length).toBe(2);
      })
    );

    db.createReadStream().on('data', data => {
      console.log(data);
    });

    await new Promise(r => setTimeout(r, 200));
  });
});
