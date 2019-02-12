import pull from 'pull-stream';
import { tap } from 'pull-tap';
import paraMap from 'pull-paramap';

// USAGE:
// import { createSourceAndSinkFor } from './db-jobs/helpers';
// import { provideServiceWorkerCaching } from './db-jobs/serviceworker-caching';

// const addUrlsToServiceWorkerCache = provideServiceWorkerCaching(
//   createSourceAndSinkFor(level, ['jobs', 'add_to_cache'])
// );

// pull(
//   ... stream of URL strings
//   addUrlsToServiceWorkerCache()
// )

const defaultOptions = {
  // createSource,
  // createSink,
  // cacheName: string,
  parallelDownloads: 5,
};
export function provideServiceWorkerCaching(options) {
  const { parallelDownloads, createSource, createSink, cacheName } = {
    ...defaultOptions,
    ...options,
  };
  // process add_to_cache jobs for Db
  pull(
    createSource({
      gte: null,
      lte: undefined,
      live: true,
    }),

    pull.filter(({ value }) => !!value), // not needed?
    paraMap(
      ({ key, value }, cb) =>
        caches
          .open(cacheName)
          .then(cache =>
            cache.add(new Request(key, { credentials: 'include' }))
          )
          .then(
            // when succeeded, remove the job
            () => cb(null, { key, type: 'del' }),
            // if failed, write back into level
            () =>
              cb(null, {
                key,
                value: { ...value, tries: (value.tries || 0) + 1 },
              })
          ),
      parallelDownloads,
      false // order is not important
    ),
    tap(console.log),
    createSink({ windowSize: parallelDownloads })
  );

  return function addToServiceWorkerCacheJobs() {
    return pull(pull.map(url => ({ key: url, value: {} })), createSink());
  };
}
