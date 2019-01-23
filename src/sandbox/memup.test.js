const levelup = require('levelup');
const memdown = require('memdown');
const pl = require('pull-level');
const pull = require('pull-stream');
const createAbortable = require('pull-abortable');
const encode = require('encoding-down');

const live = (db, opts, cb) => {
  const abortable = createAbortable();

  pull(
    pl.read(db, { live: true, sync: false, ...opts }),
    abortable,
    pull.drain(cb)
  );

  return abortable.abort;
};

describe('learn mem level db', () => {
  test('it works', async () => {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }));

    const key = Math.random()
      .toString(36)
      .substr(2, 4);
    let values = [];

    const stopFollowing = live(db, { lte: key, gte: key }, ({ value }) =>
      values.push(value)
    );

    await new Promise(r => setTimeout(r, 0));
    await db.put(key, { test: 'val' });
    await new Promise(r => setTimeout(r, 0));

    expect(values).toEqual([{ test: 'val' }]);

    stopFollowing();

    await db.put(key, 'newvalue');
    await new Promise(r => setTimeout(r, 0));

    expect(values).toEqual([{ test: 'val' }]);
  });
});
