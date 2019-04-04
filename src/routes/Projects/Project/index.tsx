import { Router, RouteComponentProps, navigate } from '@reach/router';
import React, { useContext } from 'react';

import { useNewUIContext } from '../../../contexts/ui';
import { Bug, MapLocation } from 'grommet-icons';
import { ProjectModel } from '../../../SPO/model/Project/model';
import { useProjects } from '../index';
import { Loader } from '../../../components/Loader/index';
import { ProjectOverview } from '../../../SPO/model/Project/ProjectOverview';
import { subj } from '../../../utils/spo';
import { observer } from 'mobx-react-lite';

const ProjectContext = React.createContext<[ProjectModel, subj]>(null as any);
export const useProject = () => useContext(ProjectContext);

export const Project: React.FunctionComponent<
  RouteComponentProps<{
    projectId: string;
  }>
> = observer(({ projectId }) => {
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

  const subj = projectId!.split('.');
  const project = useProjects().get(subj[subj.length - 1]);

  return (
    <UIContext.Provider>
      {project ? (
        project.fold(
          project => (
            <ProjectContext.Provider value={[project, subj]}>
              <Router>
                <Overview path="/" />
              </Router>
            </ProjectContext.Provider>
          ),
          partial => <Loader />
        )
      ) : (
        <div>Cannot find project {projectId}</div>
      )}
    </UIContext.Provider>
  );
});

export const Overview: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => <ProjectOverview project={useProject()} />;
