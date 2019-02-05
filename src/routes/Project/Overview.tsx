import React from 'react';
import { useProjectAs } from './index';
import { useObserver } from 'mobx-react-lite';
import { RouteComponentProps } from '@reach/router';

import { Box, Heading } from 'grommet';

export const Overview: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => {
  const project = useProjectAs(project => ({
    current: project,
    get cap() {
      return project.title.toUpperCase();
    },
  }));

  return useObserver(() => (
    <Box>
      <Heading>
        Project {project.cap} {project.current.title}
      </Heading>
      Overview
    </Box>
  ));
};
