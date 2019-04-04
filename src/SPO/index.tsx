import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { AsyncProject } from './model/Project/model';
import { RouteComponentProps } from '@reach/router';

import { useModel, useAccount } from '../contexts/spo-hub';
import { AsyncUser } from './model/User';
import { ProjectFormCreate } from './model/Project/ProjectFromCreate';

const projectId = 'bk0wb0a7sz';

export const SPO: React.FunctionComponent<RouteComponentProps<{}>> = ({}) => {
  const user = useAccount();

  return useObserver(() => (
    <div>
      {user.value ? (
        <div>
          <h1>{user.value.name}</h1>
          {user.value.uName}
          {[...user.value.projects.entries()].map(([key, project]) => (
            <li key={key}>
              {key} {project.value ? project.value.name : 'not yet'}
            </li>
          ))}
          <ProjectFormCreate
            onSubmit={async project => {
              user.value!.addProject(project);
            }}
          />
        </div>
      ) : (
        <pre>{user.errors && user.errors.join('\n')}</pre>
      )}
    </div>
  ));
};
