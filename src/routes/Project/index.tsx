import { Router, RouteComponentProps } from '@reach/router';
import React, { useContext } from 'react';

import { IProject } from '../../models/Project';

import { Overview } from './Overview';
import { useComputed } from 'mobx-react-lite';
import { observable } from 'mobx';
import { LevelContext, useLevel } from '../../contexts/level';
import { Sync } from './Sync';

interface ProjectParams {
  projectId: string;
}

const ProjectIdContext = React.createContext<string>('');
export const useProjectId = () => useContext(ProjectIdContext);

// export const useProject = () => useContext(ProjectContext);
// export const useProjectAs = <T extends any>(
//   createObservable: (project: IProject) => T
// ) => {
//   const project = useContext(ProjectContext);
//   return useComputed(() => observable(createObservable(project)), [project]);
// };

export const Project: React.FunctionComponent<
  RouteComponentProps<ProjectParams>
> = ({ projectId }) => {
  const level = useLevel();
  return (
    <ProjectIdContext.Provider value={projectId!}>
      <LevelContext.Provider value={level.partition(projectId)}>
        <Sync />
        {/* <ProvideProject> */}
        <Router>
          <Overview path="/" />
        </Router>
        {/* </ProvideProject> */}
      </LevelContext.Provider>
    </ProjectIdContext.Provider>
  );
};

// const ProvideProject: React.FunctionComponent<{}> = ({ children }) => {
//   const level = useLevel();
//   const { local, remote, name } = usePouchDB();
//   const { active, progress } = useSync(local, remote);
//   const project = useModel(ProjectModel, local, name);

//   return project ? (
//     <ProjectContext.Provider value={project}>
//       <ul>
//         <li>
//           active {active ? 'true' : 'false'} progress {progress}
//         </li>
//       </ul>
//       {children}
//     </ProjectContext.Provider>
//   ) : (
//     <div>Loading project</div>
//   );
// };
