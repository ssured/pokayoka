import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { RouteComponentProps } from '@reach/router';

import { Box, Heading } from 'grommet';
import { useProjectId } from './index';
import { useModel } from '../../contexts/store';
import { Project } from '../../models/Project';
import { ISite } from '../../models/Site';

const LoadingIndicator = () => <p>Loading...</p>;
const ErrorMessage = (error: Error) => (
  <h3>Uh oh, something happened {error.message}</h3>
);

const SitesList: React.SFC<{ sites: ISite[] }> = ({ sites }) => (
  <>
    <Heading>{sites.length} sites gevonden:</Heading>
    <ul>
      {sites.map(site => (
        <li key={site.id}>{site.name}</li>
      ))}
    </ul>
  </>
);

export const Overview: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => {
  const projectId = useProjectId();
  const project = useModel(Project, projectId);

  return useObserver(() => (
    <Box>
      {project.fold(
        LoadingIndicator,
        project => (
          <>
            <Heading>Project {project.name}</Heading>

            <div>
              {project.sites.fold(
                LoadingIndicator,
                sites => SitesList({ sites }),
                ErrorMessage
              )}
            </div>
          </>
        ),
        ErrorMessage
      )}
    </Box>
  ));
};
