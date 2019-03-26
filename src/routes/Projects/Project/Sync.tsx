import React, { useEffect, useState } from 'react';
import { useObserver } from 'mobx-react-lite';

import { Box, Heading } from 'grommet';
import { useMux } from '../../../contexts/mux';
import { useLevel } from '../../../contexts/level';
import pull, { filter, map, drain } from 'pull-stream';
import { useProjectId } from './index';
import tee from 'pull-tee';
import { tap } from 'pull-tap';
import debounce from 'pull-debounce';
import createAbortable from 'pull-abortable';

import debug from 'debug';
import base, { filename } from 'paths.macro';
import { addToServiceWorkerCacheJobs } from '../../../jobs/file-caching';
import flatMap from 'pull-flatmap';
import {
  objectHasHam,
  getHamFromObject,
  maxStateFromHam,
} from '../../../mst-ham/index';
const log = debug(`${base}${filename}`);

const SYNC_META_PULL_SINCE_KEY = 'pull_since';
const SYNC_META_PUSH_FROM_KEY = 'push_from';

export const Sync: React.FunctionComponent<{}> = () => {
  const projectId = useProjectId();
  const partition = useLevel();
  const syncMeta = partition.partition('sync');
  const mux = useMux();

  const [{ pending, maxPending, lastAction }, setPending] = useState<{
    pending: number;
    maxPending: number;
    lastAction: string;
  }>({ pending: Infinity, maxPending: 0, lastAction: '' });

  const updatePending = (newPending: number) => {
    if (pending === 0) {
      setPending({
        pending: newPending,
        maxPending: newPending,
        lastAction: new Date().toISOString(),
      });
    } else if (newPending < pending || newPending > maxPending) {
      setPending({
        pending: Math.min(newPending, pending),
        maxPending: newPending === 0 ? 0 : Math.max(newPending, maxPending),
        lastAction: new Date().toISOString(),
      });
    }
  };

  const progress = isFinite(pending)
    ? maxPending === 0
      ? 100
      : (100 * (maxPending - pending)) / maxPending
    : -1;

  useEffect(() => {
    if (mux == null) return;

    const pullSync = createAbortable();
    const pushSync = createAbortable();
    let unmounted = false;
    let startedPulling = false;
    let startedPushing = false;

    syncMeta
      .get<string>(SYNC_META_PULL_SINCE_KEY)
      .catch(() => '0')
      .then(since => {
        if (unmounted) return;
        log('pull sync since %s', since);
        pull(
          // @ts-ignore
          mux.changesSince(projectId, {
            since,
            include_docs: true,
          }),
          pullSync,

          tap<{ sync: boolean }>(({ sync }) => sync && updatePending(0)),
          filter(({ sync }) => !sync), // ignore the in-sync marker
          tee([
            // keep track of the latest seq seen in the stream, useful for restarting
            // @ts-ignore
            pull(
              filter<{ seq?: string }, { seq: string }>(({ seq }) => !!seq),
              // @ts-ignore
              debounce(100), // debounce as we do not need to write all intermediate values
              tap<{ pending?: number }>(
                ({ pending }) => pending && updatePending(pending)
              ),
              // @ts-ignore
              map(({ seq }) => ({
                key: SYNC_META_PULL_SINCE_KEY,
                value: seq,
              })),
              syncMeta.sink({ windowSize: 1, windowTime: 1 })
            ),
            // make sure the attachment of the incoming documents are added to the cache
            pull(
              // @ts-ignore
              flatMap(({ doc }) =>
                Object.keys(doc._attachments || {}).map(filename =>
                  ['', 'db', projectId, doc._id, filename]
                    .map(encodeURIComponent)
                    .join('/')
                )
              ),
              addToServiceWorkerCacheJobs()
            ),
          ]),
          // @ts-ignore
          map(({ doc, deleted }) => ({
            key: doc._id,
            value: doc,
            type: deleted ? 'del' : 'put',
          })),
          tap(doc => log('store doc %O', doc)),
          // FIXME putting something else than 1 for windowSize breaks the live updating of the app for some reason
          partition.sink({ windowSize: 1, windowTime: 1 })
        );
        startedPulling = true;
      });

    syncMeta
      .get<number>(SYNC_META_PUSH_FROM_KEY)
      .catch(() => 0)
      .then(from => {
        if (unmounted) return;
        log('push sync from state %s', from);

        // TODO this can be indexed

        pull(
          // @ts-ignore
          partition.source({
            // all non empty strings
            gt: '',
            lt: [],

            // keep listening to new jobs
            live: true,
            sync: false,
          }),
          pushSync,
          filter(
            // @ts-ignore
            ({ value }) =>
              objectHasHam(value) &&
              maxStateFromHam(getHamFromObject(value)) >= from
          ), // only ham objects
          mux.remoteMerge(projectId),
          // @ts-ignore
          debounce(100), // debounce as we do not need to write all intermediate values
          // @ts-ignore
          filter(({ ok }) => !!ok),
          // @ts-ignore
          map(({ value }) => ({
            key: SYNC_META_PUSH_FROM_KEY,
            value: maxStateFromHam(getHamFromObject(value)),
          })),
          syncMeta.sink({ windowSize: 1, windowTime: 1 })
        );
        startedPushing = true;
      });

    return () => {
      unmounted = true;
      if (startedPulling) pullSync.abort();
      if (startedPushing) pushSync.abort();
    };
  }, [mux]);
  // const project = useProjectAs(project => ({
  //   current: project,
  //   get capitalized() {
  //     return project.title.toUpperCase();
  //   },
  // }));

  return useObserver(() => (
    <Box>
      <Heading>
        Project {projectId} {progress > -1 ? `${Math.round(progress)}%` : '?%'}
      </Heading>
      {lastAction}
    </Box>
  ));
};
