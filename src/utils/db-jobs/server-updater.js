import pull from 'pull-stream';
import createAbortable from 'pull-abortable';
import { tap } from 'pull-tap';

import { generateId } from '../../utils/id';

// USAGE:
// import { createSourceAndSinkFor } from './db-jobs/helpers';
// import { provideServerUpdater } from './db-jobs/server-updater';

// const {
//   startUpdating,
//   enqueueUpdate,
// } = provideServerUpdater({
//   ...createSourceAndSinkFor(level, ['jobs', 'send_to_server']),
//   createServerThrough: () => mux.upload(),
// });
// const stopUpdating = startUpdating();

// pull(
//   ... stream of URL strings
//   enqueueUpdate()
// )

const defaultOptions = {
  // createSource,
  // createSink,
  // createServerThrough,
  // databaseName
};
export function provideServerUpdater(options) {
  const { createSource, createSink, createServerThrough, databaseName } = {
    ...defaultOptions,
    ...options,
  };

  function startUpdating() {
    const abortable = createAbortable();

    pull(
      createSource({
        gt: '',
        lt: [],

        // keep listening to new jobs
        old: true,
        live: true,
        sync: false,
      }),
      abortable,
      // tap(doc => console.log('server-updater start', doc)),
      createServerThrough(),
      tap(doc => console.log('server-updater', doc)),
      pull.map(({ key, value, ok }) => ({
        key,
        value: ok ? null : value,
        type: ok ? 'del' : 'put',
      })),
      createSink({ windowSize: 1 })
    );

    return abortable.abort;
  }

  function enqueueUpdate() {
    return pull(
      pull.map(doc => {
        return {
          key: generateId(),
          value: { doc, databaseName },
          type: 'put',
        };
      }),
      createSink({ windowSize: 1 })
    );
  }

  return {
    startUpdating,
    enqueueUpdate,
  };
}
