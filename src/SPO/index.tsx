import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { AsyncProject } from './model/Project';
import { RouteComponentProps } from '@reach/router';

import { useModel } from '../contexts/spo-hub';

const projectId = 'bk0wb0a7sz';

export const SPO: React.FunctionComponent<RouteComponentProps<{}>> = ({}) => {
  const project = useModel(AsyncProject, projectId);
  return useObserver(() => (
    <div>
      <h1>Partial: {project.partial.name}</h1>

      <h1>
        Serialized: {typeof project.serialized}{' '}
        {project.serialized && project.serialized.name}
        {project.value && project.value.uName}
      </h1>
    </div>
  ));
};
