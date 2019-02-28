import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { RouteComponentProps } from '@reach/router';

import { Box, Heading } from 'grommet';
import { useModel } from '../../contexts/level';
import { Project } from '../../models/Project';
import { useProjectId } from './index';
import { ProjectForm } from '../../components/ProjectForm';

export const Overview: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => {
  const projectId = useProjectId();
  const project = useModel(Project, projectId);

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
      <ul>
        {project &&
          project.sites.map(site => (
            <li key={site._id}>
              {site._id} {site.title}
            </li>
          ))}
      </ul>
      {project && <ProjectForm project={project} />}
    </Box>
  ));
};
