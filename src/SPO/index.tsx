import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { AsyncProject } from './model/Project';
import { RouteComponentProps } from '@reach/router';

import { useModel } from '../contexts/spo-hub';
import { AsyncUser } from './model/User';
import { CreateForm } from './model/Project/create-form';

const projectId = 'bk0wb0a7sz';

export const SPO: React.FunctionComponent<RouteComponentProps<{}>> = ({}) => {
  const project = useModel(AsyncProject, projectId);
  const user = useModel(AsyncUser, ['user', 'sjoerd@weett.nl']);

  return useObserver(() => (
    <div>
      {project.value ? <h1>{project.value.uName}</h1> : 'no project'}

      {user.value ? (
        <div>
          <h1>{user.value.name}</h1>
          {user.value.uName}
          {[...user.value.projects.entries()].map(([key, project]) => (
            <li key={key}>
              {key} {project.value ? project.value.name : 'not yet'}
            </li>
          ))}
          <CreateForm
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
