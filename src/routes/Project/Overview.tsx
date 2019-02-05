import React from 'react';
import { useProject } from './index';
import { useObserver } from 'mobx-react-lite';

import { Box, Heading } from 'grommet';

export const Overview: React.FunctionComponent<{}> = () => {
  const project = useProject();
  return useObserver(() => (
    <Box>
      <Heading>Project {project.title}</Heading>
      Overview
    </Box>
  ));
};
