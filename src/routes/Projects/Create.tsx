import React from 'react';
import { RouteComponentProps } from '@reach/router';
import { useRoot } from '../../contexts/spo-hub';
import { observer } from 'mobx-react-lite';
import { generateId } from '../../../server/utils/snag-id';
import { ProjectFormEdit } from '../../model/Project/ProjectFormEdit';
import { setSubject } from '../../model/base';
import { Project } from '../../model/Project/model';
import { UndefinedOrPartialSPO } from '../../utils/spo-observable';

export const Create: React.SFC<
  RouteComponentProps<{}> & {
    onCreate: (partialProject: UndefinedOrPartialSPO<Project>) => void;
  }
> = observer(({ onCreate }) => {
  const root = useRoot();
  const project = {};

  return (
    <ProjectFormEdit
      project={project}
      onSubmit={e => {
        const id = generateId();
        setSubject(root.projects!, id, e.value as any);
        onCreate(root.projects![id]!);
      }}
    />
  );
});
