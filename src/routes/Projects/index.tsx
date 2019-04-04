import { Router, RouteComponentProps } from '@reach/router';
import React, { useContext } from 'react';

import { List } from './List';
import { useNewUIContext } from '../../contexts/ui';
import { ObservableMap } from 'mobx';
import { WrapAsync } from '../../SPO/model/base';
import { ProjectModel, Project } from '../../SPO/model/Project/model';
import { useAccount } from '../../contexts/spo-hub';
import { Project as ProjectComponent } from './Project';
import { observer } from 'mobx-react-lite';

interface ProjectsParams {}

const ProjectsContext = React.createContext<
  ObservableMap<string, WrapAsync<Project, ProjectModel>>
>(null as any);
export const useProjects = () => useContext(ProjectsContext);

export const Projects: React.FunctionComponent<
  RouteComponentProps<ProjectsParams>
> = observer(({}) => {
  const UIContext = useNewUIContext({
    navContext: { label: 'Projecten', path: '/projects' },
  });
  const account = useAccount();
  return (
    <UIContext.Provider>
      {account.fold(
        user => (
          <ProjectsContext.Provider value={user.projects}>
            <Router>
              <List path="/" />
              <ProjectComponent path="/:projectId/*" />
            </Router>
          </ProjectsContext.Provider>
        ),
        partial => (
          <pre>Loading, {partial.name}</pre>
        )
      )}
    </UIContext.Provider>
  );
});
