import { Router, RouteComponentProps } from '@reach/router';
import React, { useContext } from 'react';

import { Overview } from './Overview';
import { Observations } from './Observations';
import { ProvideStore } from '../../contexts/store';
import { Sheets } from './Sheets';

interface ProjectParams {
  projectId: string;
}

const ProjectIdContext = React.createContext<string>('');
export const useProjectId = () => useContext(ProjectIdContext);

export const Project: React.FunctionComponent<
  RouteComponentProps<ProjectParams>
> = ({ projectId }) => {
  console.log({ projectId });
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
