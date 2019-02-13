import pull from 'pull-stream';
import { tap } from 'pull-tap';
import paraMap from 'pull-paramap';
import createAbortable from 'pull-abortable';
import Backoff from '../backoff';

// USAGE:
// import { createSourceAndSinkFor } from './db-jobs/helpers';
// import { provideServiceWorkerCaching } from './db-jobs/serviceworker-caching';

// const {
//   startServiceWorkerCacheJobs,
//   addToServiceWorkerCacheJobs,
// } = provideServiceWorkerCaching({
//   ...createSourceAndSinkFor(level, ['jobs', 'add_to_cache']),
//   cacheName: db,
// });
// const abortCacheJobs = startServiceWorkerCacheJobs();

// pull(
//   ... stream of URL strings
//   addToServiceWorkerCacheJobs()
// )

const defaultOptions = {
  // createSource,
  // createSink,
  // cacheName: string,
  parallelDownloads: 5,
};
export function provideServiceWorkerCaching(options) {
  const { createSource, createSink, cacheName, parallelDownloads } = {
    ...defaultOptions,
    ...options,
  };

  function startServiceWorkerCacheJobs() {
    const abortable = createAbortable();
    const backoff = new Backoff(0, 100, 5000, 1.5);

    // process add_to_cache jobs for Db
    pull(
      createSource({
        // all non empty strings
        gt: '',
        lt: [],

        // keep listening to new jobs
        old: true,
        live: true,
        sync: false,
      }),
      abortable,
      pull.asyncMap((item, cb) =>
        setTimeout(() => cb(null, item), backoff.current)
      ),
      paraMap(
        ({ key, value = {} }, cb) =>
          caches
            .open(cacheName)
            .then(cache =>
              cache.add(new Request(key, { credentials: 'include' }))
            )
            .then(
              // when succeeded, remove the job
              () => {
                backoff.success();
                cb(null, { key, type: 'del' });
              },
              // if failed, write back into level
              () => {
                backoff.fail();
                cb(null, {
                  key,
                  value: {
                    ...value,
                    tries: (value.tries || []).concat(new Date().toISOString()),
                  },
                });
              }
            ),
        parallelDownloads,
        false // order is not important
      ),
      tap(console.log),
      createSink({ windowSize: parallelDownloads })
    );

    return abortable.abort;
  }

  function addToServiceWorkerCacheJobs() {
    return pull(pull.map(url => ({ key: url, value: {} })), createSink());
  }

  return {
    startServiceWorkerCacheJobs,
    addToServiceWorkerCacheJobs,
  };
}
