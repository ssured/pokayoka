import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { AsyncProject } from './model/Project';
import { RouteComponentProps } from '@reach/router';

import { useModel } from '../contexts/spo-hub';
import { AsyncUser } from './model/User';

const projectId = 'bk0wb0a7sz';

export const SPO: React.FunctionComponent<RouteComponentProps<{}>> = ({}) => {
  const project = useModel(AsyncProject, projectId);
  const user = useModel(AsyncUser, ['server', 'user', 'sjoerd@weett.nl']);

  return useObserver(() => (
    <div>
      {project.value ? <h1>{project.value.uName}</h1> : 'no project'}

      {user.value ? (
        <h1>
          {user.value.name}
          {user.value.uName}
          {user.value.projects.size}
        </h1>
      ) : (
        <pre>{user.errors && user.errors.join('\n')}</pre>
      )}
    </div>
  ));
};
