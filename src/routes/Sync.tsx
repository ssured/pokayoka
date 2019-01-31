import { RouteComponentProps } from '@reach/router';
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Flex, Heading } from '../components/base';
import { useAccount } from '../hooks/index';
import { ConnectPouchDB, usePouchDB } from '../contexts/pouchdb';
import { useAsync } from 'react-use';
import PouchDB from 'pouchdb';
import { Box as GBox, Text, Stack, Meter } from 'grommet';

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

const useSync = () => {
  const { local, remote } = usePouchDB()!;
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
  // (lastPullChange ? lastPullChange.docs_read : 0);
  const pushPending =
    (lastPushChange && (lastPushChange as any).pending) || -Infinity;
  // (lastPushChange ? lastPushChange.docs_read : 0);

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

  // console.log(maxPullPending, pullProgress, maxPushPending, pushProgress);

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
  };
};

const LabelledMeter: React.FunctionComponent<{
  value: number;
  label: string;
}> = ({ value, label }) => (
  <GBox align="center" pad="large">
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
  const {
    lastPullChange: lastChange,
    active,
    pullProgress,
    pushProgress,
  } = useSync();

  return (
    <GBox>
      <Text>Active: {active ? 'true' : 'false'}</Text>
      {lastChange && (
        <>
          <Text>Read: {lastChange.docs_read}</Text>
          <Text>Written: {lastChange.docs_written}</Text>
          <Text>Write failures: {lastChange.doc_write_failures}</Text>
          <Text>Pending: {(lastChange as any).pending}</Text>
          {pullProgress !== false && (
            <LabelledMeter label="Pull progress" value={pullProgress} />
          )}
          {pushProgress !== false && (
            <LabelledMeter label="Push progress" value={pushProgress} />
          )}
        </>
      )}
    </GBox>
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
