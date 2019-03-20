const pull = require('pull-stream');
const toPull = require('pull-promise');
const flatMap = require('pull-flatmap');
const next = require('pull-next');
const createPushable = require('pull-pushable');
const createLive = require('pull-live');
const createAbortable = require('pull-abortable');
// const streamToPull = require('stream-to-pull-stream');

const dbChanges = (nano, name, options = {}) =>
  pull(
    toPull.source(nano.db.changes(name, { since: 0, limit: 10, ...options })),
    flatMap(({ results, last_seq, pending }) =>
      results.length === 0
        ? [{ last_seq, pending, empty: true }]
        : results.map(result => ({ ...result, last_seq, pending }))
    )
  );

const dbChangesSince = (nano, name, options = {}) => {
  // read changes in chunks, until in sync
  // option.limit determines chunk size
  let since = options.since || 0;
  let pending = Infinity;
  return next(
    () =>
      pending > 0 &&
      pull(
        dbChanges(nano, name, { ...options, since }),
        pull.through(({ last_seq, pending: pending_ }) => {
          since = last_seq;
          pending = pending_;
        }),
        pull.filter(({ empty }) => !empty)
      )
  );
};

const dbChangesLive = (nano, name, options = {}) => {
  const feed = nano.db.follow(name, { ...options, since: 'now' });
  // const source = streamToPull(nano.db.follow(name, { ...options, since: 'now' }));

  const p = createPushable(true, () => feed.stop());
  feed.on('change', change => p.push(change));
  feed.follow();
  return p.source;
};

const shareSource = (sourceCreator, onActive, onInactive) => {
  const listeners = [];
  let abortable;

  return function listen() {
    // create listener with `onClose` handler
    const listener = createPushable(function onClose() {
      // if listener is found, delete from list
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          // end the created source stream when there are no listeners left
          abortable.abort();
          onInactive && onInactive();
        }
      }
    });

    if (listeners.length === 0) {
      // create a new pull stream to listen to
      abortable = createAbortable();
      pull(
        sourceCreator(),
        abortable,
        pull.drain(
          message => {
            // notify by pushing to all listeners
            for (var i = 0; i < listeners.length; i++) {
              listeners[i].push(message);
            }
          },
          () => {
            while (listeners.length) listeners[0].end(true);
          }
        )
      );
      onActive && onActive();
    }

    listeners.push(listener);
    return listener;
  };
};

const dbChangesSinceLive = (nano, name, options = {}) => {
  const sharedLive = shareSource(() => dbChangesLive(nano, name, options));
  return createLive(
    () => dbChangesSince(nano, name, options),
    () => sharedLive()
  )({ old: true, live: true });
};

module.exports = {
  dbChanges,
  dbChangesSince,
  dbChangesLive,
  dbChangesSinceLive,
  shareSource,
};
