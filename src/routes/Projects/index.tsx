import { Router, RouteComponentProps, navigate } from '@reach/router';
import React, { useContext } from 'react';

import { List } from './List';
import { Create } from './Create';
import { useNewUIContext } from '../../contexts/ui';
import { ObservableMap } from 'mobx';
import { WrapAsync } from '../../model/base';
import { ProjectModel, Project } from '../../model/Project/model';
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
              <Create
                path="/create"
                onCreate={project => navigate(`/columns/${project.code}`)}
              />
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
