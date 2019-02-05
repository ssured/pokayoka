import { RouteComponentProps } from '@reach/router';
import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Flex, Heading } from '../components/base';
import { useAccount } from '../hooks/index';
import {
  ConnectPouchDB,
  usePouchDB,
  useSync,
  useDoc,
} from '../contexts/pouchdb';
// import { useAsync } from 'resact-use';
import { Box as GBox, Text, Stack, Meter } from 'grommet';

interface SyncParams {}

// const ShowDocs: React.FunctionComponent<{}> = ({}) => {
//   const { local, remote } = usePouchDB()!;
//   const localInfo = useAsync(() => local.info(), [local]);
//   const remoteInfo = useAsync(() => remote.info(), [remote]);

//   return (
//     <div>
//       <pre>{JSON.stringify(localInfo, null, 2)}</pre>
//       <pre>{JSON.stringify(remoteInfo, null, 2)}</pre>
//     </div>
//   );
// };

const LabelledMeter: React.FunctionComponent<{
  value: number;
  label: string;
}> = ({ value, label }) => (
  <GBox align="center">
    <Stack anchor="center">
      <Meter
        type="circle"
        background="light-2"
        values={[{ label, value }] as any}
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

const DatabaseCard: React.FunctionComponent<{}> = ({}) => {
  const { local, remote, name } = usePouchDB()!;
  const { active, progress } = useSync(local, remote);
  const doc = useDoc<{ title: string }>(local, name);
  return (
    <Box>
      <Heading>{doc ? doc.title : name}</Heading>
      <LabelledMeter
        label="Progress"
        value={progress === false ? (active ? 0 : 100) : progress}
      />
    </Box>
  );
};

export const Sync = observer((props: RouteComponentProps<SyncParams>) => {
  const account = useAccount();

  return (
    <Flex flexDirection="column">
      {account.loading
        ? 'loading'
        : account.error
        ? 'Error'
        : account.value.databases.map(database => (
            <ConnectPouchDB key={database} dbname={database}>
              <DatabaseCard />
            </ConnectPouchDB>
          ))}
    </Flex>
  );
});
