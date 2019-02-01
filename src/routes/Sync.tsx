import { RouteComponentProps } from '@reach/router';
import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Flex, Heading } from '../components/base';
import { useAccount } from '../hooks/index';
import { ConnectPouchDB, usePouchDB } from '../contexts/pouchdb';
import { useAsync } from 'react-use';
import PouchDB from 'pouchdb';
import { Box as GBox, Text, Stack, Meter } from 'grommet';
// import {
//   SparkLine,
//   SparkLineValue,
//   useSparkLine,
// } from '../components/SparkLine';

interface SyncParams {}

const ShowDocs: React.FunctionComponent<{}> = ({}) => {
  const { local, remote } = usePouchDB()!;
  const localInfo = useAsync(() => local.info(), [local]);
  const remoteInfo = useAsync(() => remote.info(), [remote]);

  return (
    <div>
      <pre>{JSON.stringify(localInfo, null, 2)}</pre>
      <pre>{JSON.stringify(remoteInfo, null, 2)}</pre>
    </div>
  );
};

const useSync = (local: PouchDB.Database<{}>, remote: PouchDB.Database<{}>) => {
  const [
    lastPullChange,
    setPullChange,
  ] = useState<PouchDB.Replication.ReplicationResult<{}> | null>(null);
  const [
    lastPushChange,
    setPushChange,
  ] = useState<PouchDB.Replication.ReplicationResult<{}> | null>(null);
  const [paused, setPaused] = useState<string | boolean>(false);
  const [active, setActive] = useState<boolean>(true);
  const [lastDenied, setDenied] = useState<{} | null>(null);
  const [lastError, setError] = useState<{} | null>(null);
  const [complete, setComplete] = useState<
    PouchDB.Replication.SyncResultComplete<{}> | false
  >(false);

  const [maxPullPending, setMaxPullPending] = useState(-Infinity);
  const [maxPushPending, setMaxPushPending] = useState(-Infinity);

  const pullPending =
    (lastPullChange && (lastPullChange as any).pending) || -Infinity;
  const pushPending =
    (lastPushChange && (lastPushChange as any).pending) || -Infinity;

  if (pullPending > maxPullPending) {
    setMaxPullPending(
      pullPending + (lastPullChange ? lastPullChange.docs_read : 0)
    );
  }
  if (pushPending > maxPushPending) {
    setMaxPushPending(
      pushPending + (lastPushChange ? lastPushChange.docs_read : 0)
    );
  }

  const pullProgress: number | false =
    maxPullPending > 0 && pullPending >= 0
      ? Math.round((100 * (maxPullPending - pullPending)) / maxPullPending)
      : false;
  const pushProgress: number | false =
    maxPushPending > 0 && pushPending >= 0
      ? Math.round((100 * (maxPushPending - pushPending)) / maxPushPending)
      : false;

  const progress: number | false =
    pullProgress === false && pushProgress === false
      ? false
      : pullProgress === false
      ? pushProgress
      : pushProgress === false
      ? pullProgress
      : Math.round(
          (100 *
            (maxPullPending - pullPending + maxPushPending - pushPending)) /
            (maxPullPending + maxPushPending)
        );

  useEffect(
    () => {
      const sync = PouchDB.sync(local, remote, {
        live: true,
        retry: true,
        // batch_size: 3, // FIXME lower on tiny devices
        // batches_limit: 3,
      })
        .on('change', info => {
          info.direction === 'pull'
            ? setPullChange(info.change)
            : setPushChange(info.change);
        })
        .on('paused', (err: {}) => {
          setPaused(err ? JSON.stringify(err) : true);
          setActive(false);
        })
        .on('active', () => {
          setPaused(false);
          setActive(true);
        })
        .on('denied', setDenied)
        .on('complete', setComplete)
        .on('error', setError);

      return () => sync.cancel(); //
    },
    [local, remote]
  );

  return {
    lastPushChange,
    lastPullChange,
    paused,
    active,
    lastDenied,
    lastError,
    complete,
    pullProgress,
    pushProgress,
    progress,
  };
};

const LabelledMeter: React.FunctionComponent<{
  value: number;
  label: string;
}> = ({ value, label }) => (
  <GBox align="center">
    <Stack anchor="center">
      <Meter
        type="circle"
        background="light-2"
        values={[{ label, value }]}
        size="xsmall"
        thickness="small"
      />
      <GBox direction="row" align="center" pad={{ bottom: 'xsmall' }}>
        <Text size="xlarge" weight="bold">
          {value}
        </Text>
        <Text size="small">%</Text>
      </GBox>
    </Stack>
  </GBox>
);

const SyncDBs: React.FunctionComponent<{}> = ({}) => {
  const { local, remote } = usePouchDB()!;
  const { active, progress } = useSync(local, remote);
  return (
    <LabelledMeter
      label="Progress"
      value={progress === false ? (active ? 0 : 100) : progress}
    />
  );
};

export const Sync = observer((props: RouteComponentProps<SyncParams>) => {
  const account = useAccount();

  return (
    <Flex flexDirection="column">
      {/* <Heading fontSize={[4, 5]}>SYNC STATUS</Heading> */}

      {account.loading
        ? 'loading'
        : account.error
        ? 'Error'
        : account.value.databases.map(database => (
            <Box key={database}>
              <ConnectPouchDB dbname={database}>
                <Heading>{database}</Heading>
                <SyncDBs />
              </ConnectPouchDB>
            </Box>
          ))}

      {/* <Flex px={4} py={4}>
        <Box>Left</Box>
        <Box mx="auto" />
        <Box>Right</Box>
      </Flex> */}
    </Flex>
  );
});
