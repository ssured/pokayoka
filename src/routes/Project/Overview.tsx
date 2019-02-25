import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { RouteComponentProps } from '@reach/router';

import { Box, Heading } from 'grommet';
import { useDoc } from '../../contexts/level';
import { Project } from '../../models/Project';
import { useProjectId } from './index';

export const Overview: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => {
  const projectId = useProjectId();
  const project = useDoc(Project, projectId);

  // const project = useProjectAs(project => ({
  //   current: project,
  //   get capitalized() {
  //     return project.title.toUpperCase();
  //   },
  // }));

  return useObserver(() => (
    <Box>
      <Heading>Project</Heading>
      {(project && project.title) || 'no project'}
    </Box>
  ));
};
