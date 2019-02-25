import React, { useEffect, useState } from 'react';
import { useObserver } from 'mobx-react-lite';

import { Box, Heading } from 'grommet';
import { useMux } from '../../contexts/mux';
import { useLevel } from '../../contexts/level';
import pull, { filter, map } from 'pull-stream';
import { useProjectId } from './index';
import tee from 'pull-tee';
import { tap } from 'pull-tap';
import debounce from 'pull-debounce';
import createAbortable from 'pull-abortable';

const SYNC_META_SINCE_KEY = 'since';

export const Sync: React.FunctionComponent<{}> = () => {
  const projectId = useProjectId();
  const partition = useLevel();
  const syncMeta = partition.partition('sync');
  const mux = useMux();

  const [{ pending, maxPending }, setPending] = useState<{
    pending: number;
    maxPending: number;
  }>({ pending: Infinity, maxPending: 0 });

  const updatePending = (newPending: number) => {
    if (pending === 0) {
      setPending({ pending: newPending, maxPending: newPending });
    } else if (newPending < pending || newPending > maxPending) {
      setPending({
        pending: Math.min(newPending, pending),
        maxPending: newPending === 0 ? 0 : Math.max(newPending, maxPending),
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

    const abortable = createAbortable();
    let unmounted = false;
    let startedPulling = false;

    syncMeta
      .get<string>(SYNC_META_SINCE_KEY)
      .catch(() => '0')
      .then(since => {
        if (unmounted) return;
        pull(
          // @ts-ignore
          mux.changesSince(projectId, {
            since,
            include_docs: true,
          }),

          tap<{ sync: boolean }>(({ sync }) => sync && updatePending(0)),
          filter(({ sync }) => !sync), // ignore the in-sync marker
          tee([
            // keep track of the latest seq seen in the stream, useful for restarting
            pull(
              filter<{ seq?: string }, { seq: string }>(({ seq }) => !!seq),
              // @ts-ignore
              debounce(100), // debounce as we do not need to write all intermediate values
              tap<{ pending?: number }>(
                ({ pending }) => pending && updatePending(pending)
              ),
              // @ts-ignore
              map(({ seq }) => ({
                key: SYNC_META_SINCE_KEY,
                value: seq,
              })),
              syncMeta.sink({ windowSize: 1, windowTime: 1 })
            ),
            // make sure the attachment of the incoming documents are added to the cache
            // pull(
            //   flatMap(({ doc }) =>
            //     Object.keys(doc._attachments || {}).map(filename =>
            //       [server, db, doc._id, filename].join('/')
            //     )
            //   ),
            //   addToServiceWorkerCacheJobs()
            // ),
          ]),
          // @ts-ignore
          map(({ doc, deleted }) => ({
            key: doc._id,
            value: doc,
            type: deleted ? 'del' : 'put',
          })),
          partition.sink({ windowSize: 100, windowTime: 100 })
        );
        startedPulling = true;
      });

    return () => {
      unmounted = true;
      if (startedPulling) abortable.abort();
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
        Project {projectId}{' '}
        {progress > -1 ? `${Math.round(progress)}%` : 'sync status unknown'}
      </Heading>
      Overview
    </Box>
  ));
};
