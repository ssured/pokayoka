import { Router, RouteComponentProps, navigate } from '@reach/router';
import React, { useContext } from 'react';

import { Overview } from './Overview';
import { Observations } from './Observations';
import { ProvideStore } from '../../../contexts/store';
import { Sheets } from './Sheets';
import { useNewUIContext } from '../../../contexts/ui';
import { Bug, MapLocation } from 'grommet-icons';

interface ProjectParams {
  projectId: string;
}

const ProjectIdContext = React.createContext<string>('');
export const useProjectId = () => useContext(ProjectIdContext);

export const Project: React.FunctionComponent<
  RouteComponentProps<ProjectParams>
> = ({ projectId }) => {
  const UIContext = useNewUIContext({
    navContext: { label: 'Project', path: `/projects/${projectId}` },
    contextSubMenu: {
      type: 'append',
      items: [
        {
          icon: Bug,
          actionFn: () => navigate(`/projects/${projectId}/observations`),
          label: 'Bevindingen',
        },
        {
          icon: MapLocation,
          actionFn: () => navigate(`/projects/${projectId}/sheets`),
          label: 'Bouwlagen',
        },
      ],
    },
  });

  // console.log({ projectId });
  return (
    <UIContext.Provider>
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
    </UIContext.Provider>
  );
};
