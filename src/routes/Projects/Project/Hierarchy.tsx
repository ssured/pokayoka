import React from 'react';
import { Maybe, getPath, getKeys } from '../../../utils/universe';
import { observer } from 'mobx-react-lite';
import { Heading } from 'grommet';

export const Hierarchy: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  return (
    <>
      <Heading level="1">Project: {project.name}</Heading>
      <ul>
        {/* <li>Count: {Object.keys(project.sites).length}</li> */}
        {/* <li>Keys: {Array.from(getKeys(project) || []).join('/')}</li> */}
        {/* <li>Path: {(getPath(project.sites) || []).join('/')}</li> */}
        {Object.entries(project.sites).map(([key, site]) => (
          <li key={key}>
            <SiteHierarchy site={site} />
          </li>
        ))}
      </ul>
    </>
  );
});

const SiteHierarchy: React.FunctionComponent<{
  site: Maybe<PSite>;
}> = observer(({ site }) => {
  return (
    <>
      <Heading level="2">
        Locatie: {site.name} {site.identifier}
      </Heading>
      <ul>
        {/* <li>Count: {Object.keys(site.buildings).length}</li> */}
        {/* <li>Keys: {Array.from(getKeys(site) || []).join('/')}</li> */}
        {/* <li>Path: {(getPath(site.buildings) || []).join('/')}</li> */}
        {Object.entries(site.buildings).map(([key, building]) => (
          <li key={key}>
            <BuildingHierarchy building={building} />
          </li>
        ))}
      </ul>
    </>
  );
});

const BuildingHierarchy: React.FunctionComponent<{
  building: Maybe<PBuilding>;
}> = observer(({ building }) => {
  return (
    <>
      <Heading level="3">Gebouw: {building.name}</Heading>
      <ul>
        {Object.entries(building.buildingStoreys).map(
          ([key, buildingStorey]) => (
            <li key={key}>
              <Heading level="4">Verdieping: {buildingStorey.name}</Heading>
            </li>
          )
        )}
      </ul>
    </>
  );
});
