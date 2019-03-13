import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { RouteComponentProps } from '@reach/router';

import { Box, Heading } from 'grommet';
import { useProjectId } from './index';
import { ProjectForm } from '../../components/ProjectForm';
import { useStore } from '../../contexts/store';

export const Overview: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => {
  const projectId = useProjectId();
  const store = useStore();
  // const project = useModel(Project, projectId);

  // const project = useProjectAs(project => ({
  //   current: project,
  //   get capitalized() {
  //     return project.title.toUpperCase();
  //   },
  // }));

  return useObserver(() => (
    <Box>
      <Heading>
        Project {projectId} {typeof store.}
      </Heading>
    </Box>
  ));
};
