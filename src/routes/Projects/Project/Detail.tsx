import React from 'react';
import { Maybe } from '../../../utils/universe';
import { observer } from 'mobx-react-lite';
import { Hierarchy } from './Hierarchy';

export const Detail: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  return (
    <>
      {/* <h1>Projectnaam: {project.name} </h1>
      <ul>
        {Object.entries(project.sites).map(([key, site]) => (
          <li key={key}>{site.name}</li>
        ))}
      </ul> */}
      <Hierarchy project={project} />
    </>
  );
});
