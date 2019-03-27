import { Router, RouteComponentProps, navigate } from '@reach/router';
import React, { useContext } from 'react';

import { List } from './List';
import { Project } from './Project';
import { useUIContextSubMenu, UI, useNewUIContext } from '../../contexts/ui';

interface ProjectParams {
  projectId: string;
}

const ProjectIdContext = React.createContext<string>('');
export const useProjectId = () => useContext(ProjectIdContext);

export const Projects: React.FunctionComponent<
  RouteComponentProps<ProjectParams>
> = ({ projectId }) => {
  const newUIContext = useNewUIContext({
    navContext: { label: 'Projecten', path: 'projects' },
  });
  // console.log({ projectId });
  return (
    <newUIContext.Provider>
      <Router>
        <List path="/" />
        <Project path="/:projectId" />
      </Router>
    </newUIContext.Provider>
  );
};
