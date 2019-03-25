import { Router, RouteComponentProps, navigate } from '@reach/router';
import React, { useContext } from 'react';

import { Overview } from './Overview';
import { Observations } from './Observations';
import { ProvideStore } from '../../contexts/store';
import { Sheets } from './Sheets';
import { useUIContextMenu, useUICrumb } from '../../contexts/ui';
import { Bug, MapLocation } from 'grommet-icons';

interface ProjectParams {
  projectId: string;
}

const ProjectIdContext = React.createContext<string>('');
export const useProjectId = () => useContext(ProjectIdContext);

export const Project: React.FunctionComponent<
  RouteComponentProps<ProjectParams>
> = ({ projectId }) => {
  useUIContextMenu(
    () => ({
      type: 'append',
      items: [
        {
          icon: Bug,
          actionFn: () => navigate(`/${projectId}/observations`),
          label: 'Bevindingen',
        },
        {
          icon: MapLocation,
          actionFn: () => navigate(`/${projectId}/sheets`),
          label: 'Bouwlagen',
        },
      ],
    }),
    [projectId]
  );
  useUICrumb(() => ({ label: 'Project', path: `/${projectId}` }), [projectId]);
  // console.log({ projectId });
  return (
    <ProjectIdContext.Provider value={projectId!}>
      <ProvideStore name={projectId!}>
        {/* <Sync /> */}
        {/* <ProvideProject> */}
        <Router>
          <Overview path="/" />
          <Observations path="/observations" />
          <Sheets path="/sheets" />
        </Router>
        {/* </ProvideProject> */}
      </ProvideStore>
    </ProjectIdContext.Provider>
  );
};
