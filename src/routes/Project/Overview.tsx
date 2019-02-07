import React from 'react';
import { useProjectAs } from './index';
import { useObserver } from 'mobx-react-lite';
import { RouteComponentProps } from '@reach/router';

import { Box, Heading } from 'grommet';

import { ProjectFormBasic } from '../../components/ProjectFormBasic';

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
      <ProjectFormBasic project={project.current} />
    </Box>
  ));
};
