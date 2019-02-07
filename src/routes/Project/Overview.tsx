import React from 'react';
import { useProjectAs } from './index';
import { useObserver } from 'mobx-react-lite';
import { RouteComponentProps } from '@reach/router';

import { Box, Heading } from 'grommet';
import { BasicForm } from '../../models/Project';

export const Overview: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => {
  const project = useProjectAs(project => ({
    current: project,
    get capitalized() {
      return project.title.toUpperCase();
    },
  }));

  return useObserver(() => (
    <Box>
      <Heading>
        Project {project.capitalized} {project.current.title}
      </Heading>
      Overview
      <BasicForm project={project.current} />
    </Box>
  ));
};
