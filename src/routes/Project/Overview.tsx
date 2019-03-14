import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { RouteComponentProps } from '@reach/router';

import { Box, Heading } from 'grommet';
import { useProjectId } from './index';
import { useModel } from '../../contexts/store';
import { Project } from '../../models/Project';

export const Overview: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => {
  const projectId = useProjectId();
  const project = useModel(Project, projectId);

  return useObserver(() => (
    <Box>
      {project.fold(
        () => (
          <p>Loading...</p>
        ),
        project => (
          <>
            <Heading>Project {project.name}</Heading>

            <div>
              {project.sites.fold(
                () => (
                  <p>Loading sites</p>
                ),
                sites => (
                  <>
                    <Heading>{sites.length} sites gevonden:</Heading>
                    <ul>
                      {sites.map(site => (
                        <li key={site.id}>{site.name}</li>
                      ))}
                    </ul>
                  </>
                ),
                error => (
                  <h3>Uh oh, something happened {error.message}</h3>
                )
              )}
            </div>
          </>
        ),
        error => (
          <h3>Uh oh, something happened {error.message}</h3>
        )
      )}
    </Box>
  ));
};
