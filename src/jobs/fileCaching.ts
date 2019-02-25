import pull, { asyncMap, map, Sink } from 'pull-stream';
import { tap } from 'pull-tap';
import paraMap from 'pull-paramap';
import createAbortable from 'pull-abortable';
import { Backoff } from '../utils/backoff';
import { rootPartition } from '../contexts/level';

const jobsPartition = rootPartition.partition('jobs');
const cacheName = 'fileCache';
const parallelDownloads = 5;

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

function startServiceWorkerCacheJobs() {
  const abortable = createAbortable();
  const backoff = new Backoff(0, 100, 5000, 1.5);

  // process add_to_cache jobs for Db
  pull(
    jobsPartition.source({
      // all non empty strings
      gt: '',
      lt: [],

      // keep listening to new jobs
      live: true,
      sync: false,
    }),
    abortable,
    asyncMap((item, cb) => setTimeout(() => cb(null, item), backoff.current)),
    paraMap(
      // @ts-ignore
      ({ key, value = {} }, cb) => {
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
                  tries: ((value as any).tries || []).concat(
                    new Date().toISOString()
                  ),
                },
              });
            }
          );
      },
      parallelDownloads,
      false // order is not important
    ),
    // tap(console.log),
    jobsPartition.sink({ windowSize: parallelDownloads, windowTime: 1 })
  );

  return abortable.abort;
}
startServiceWorkerCacheJobs();

export function addToServiceWorkerCacheJobs(): Sink<string> {
  return pull(
    // @ts-ignore
    map(url => ({ key: url, value: {} })),
    jobsPartition.sink({ windowSize: 1, windowTime: 1 })
  );
}
