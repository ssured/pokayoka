const nano = require('nano')('http://admin:admin@localhost:5984');
const pull = require('pull-stream');
const { tap } = require('pull-tap');
const onEnd = require('pull-stream/sinks/on-end');
const createPushable = require('pull-pushable');
const createAbortable = require('pull-abortable');

const {
  dbChanges,
  dbChangesLive,
  dbChangesSince,
  shareSource,
} = require('./pull');

describe('read _changes as stream', () => {
  test('it read changes feed', async () => {
    const name = 'bk0wb0a7sz';

    const items = [];
    await new Promise(res =>
      pull(dbChanges(nano, name), tap(item => items.push(item)), onEnd(res))
    );

    // console.log(items.pop());
    expect(items.length).toEqual(10);
  });

  test('it reads changes feed in parts', async () => {
    const name = 'bk0wb0a7sz';

    const changesCount = (await nano.db.changes(name)).results.length;

    const items = [];
    await new Promise(res =>
      pull(
        dbChangesSince(nano, name, { limit: 100 }),
        tap(item => items.push(item)),
        onEnd(res)
      )
    );

    expect(items.length).toEqual(changesCount);
  });

  test('it follows live', async () => {
    const name = 'bk0wb0a7sz';
    const db = nano.use(name);

    const items = [];
    const pullWillEnd = new Promise(res =>
      pull(
        dbChangesLive(nano, name),
        pull.take(1),
        tap(item => items.push(item)),
        onEnd(res)
      )
    );

    await new Promise(res => setTimeout(res, 10));
    expect(items.length).toEqual(0);

    // update doc
    await db.insert(await db.get(name));

    await pullWillEnd;

    expect(items.length).toEqual(1);
  });

  test('shareSource', async () => {
    let invokes = 0;
    let pushable;
    const items = [];

    const shared = shareSource(
      () => {
        pushable = createPushable();
        return pushable;
      },
      () => invokes++,
      () => invokes--
    );

    const pullWillEnd = new Promise(res =>
      pull(shared(), tap(item => items.push(item)), onEnd(res))
    );

    expect(invokes).toBe(1);
    expect(items.length).toBe(0);
    pushable.push('data');
    expect(items.length).toBe(1);

    const abortable = createAbortable();
    pull(shared(), abortable, pull.drain());

    expect(invokes).toBe(1);
    abortable.abort();
    expect(invokes).toBe(1);

    pushable.end();
    expect(invokes).toBe(0);

    await pullWillEnd;
  });
});
