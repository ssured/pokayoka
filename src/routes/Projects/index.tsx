import { Router, RouteComponentProps } from '@reach/router';
import React, { useContext } from 'react';

import { List } from './List';
import { Project } from './Project';
import { useNewUIContext } from '../../contexts/ui';

interface ProjectsParams {}

const ProjectIdContext = React.createContext<string>('');
export const useProjectId = () => useContext(ProjectIdContext);

export const Projects: React.FunctionComponent<
  RouteComponentProps<ProjectsParams>
> = ({}) => {
  const UIContext = useNewUIContext({
    navContext: { label: 'Projecten', path: '/projects' },
  });
  return (
    <UIContext.Provider>
      <Router>
        <List path="/" />
        <Project path="/:projectId/*" />
      </Router>
    </UIContext.Provider>
  );
};
