import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { RouteComponentProps } from '@reach/router';

import { Box, Heading } from 'grommet';
import { useProjectId } from './index';

export const Overview: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => {
  const projectId = useProjectId();

  return useObserver(() => (
    <Box>
      <Heading>Project {projectId}</Heading>
    </Box>
  ));
};
