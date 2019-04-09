import React from 'react';
import { RouteComponentProps, navigate } from '@reach/router';
import { useRoot } from '../../contexts/spo-hub';
import { observer } from 'mobx-react-lite';
import { generateId } from '../../../server/utils/snag-id';
import { ProjectFormCreate } from '../../model/Project/ProjectFormCreate';
import { setSubject } from '../../model/base';
import { Project } from '../../model/Project/model';
import { UndefinedOrPartialSPO } from '../../utils/spo-observable';

export const Create: React.SFC<RouteComponentProps<{}> & {}> = observer(
  ({}) => {
    const root = useRoot();
    return (
      <ProjectFormCreate
        onCreate={({ code, name, sitename }) => {
          const id = generateId();
          setSubject(root.projects!, id, {
            code,
            name,
            sites: {
              [generateId()]: {
                name: sitename,
                buildings: {
                  [generateId()]: {
                    name,
                    storeys: {},
                  },
                },
              },
            },
          });
          navigate(`/columns/${code}`);
        }}
      />
    );
  }
);
