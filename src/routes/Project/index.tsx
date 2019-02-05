import { Router, RouteComponentProps } from '@reach/router';
import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Flex, Heading } from '../../components/base';

import { Project as ProjectModel, IProject } from '../../models/Project';
import { useModel } from '../../hooks/model';
import { usePouchDB, ConnectPouchDB } from '../../contexts/pouchdb';

import { Overview } from './Overview';

interface ProjectParams {
  projectId: string;
}

const ProjectContext = React.createContext<IProject>(null as any);

export const useProject = () => useContext(ProjectContext);

export const Project: React.FunctionComponent<
  RouteComponentProps<ProjectParams>
> = ({ projectId }) => {
  return (
    <ConnectPouchDB dbname={projectId!}>
      <ProvideProject>
        <Router>
          <Overview path="/" />
        </Router>
      </ProvideProject>
    </ConnectPouchDB>
  );
};

const ProvideProject: React.FunctionComponent<{}> = ({ children }) => {
  const { local, name } = usePouchDB();
  const project = useModel(ProjectModel, local, name);

  return project ? (
    <ProjectContext.Provider value={project}>
      {children}
    </ProjectContext.Provider>
  ) : (
    <div>Loading project</div>
  );
};
