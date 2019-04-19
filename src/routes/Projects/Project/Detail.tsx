import React from 'react';
import { Maybe, ifExists } from '../../../utils/universe';
import { observer } from 'mobx-react-lite';

export const Detail: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  return (
    <>
      <h1>Projectnaam: {ifExists(project.name)} </h1>
      <ul>
        {Object.entries(project.sites).map(([key, site]) => (
          <li key={key}>{ifExists(site.name)}</li>
        ))}
      </ul>
    </>
  );
});
