import React from 'react';
import { Maybe, getPath, getKeys } from '../../../utils/universe';
import { observer } from 'mobx-react-lite';
import { Heading, Box } from 'grommet';

export const Hierarchy: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  return (
    <>
      <Heading level="1">Project: {project.name}</Heading>
      <Box as="ul" margin={{ left: 'medium' }}>
        {/* <li>Count: {Object.keys(project.sites).length}</li> */}
        {/* <li>Keys: {Array.from(getKeys(project) || []).join('/')}</li> */}
        {/* <li>Path: {(getPath(project.sites) || []).join('/')}</li> */}
        {Object.entries(project.sites).map(([key, site]) => (
          <Box as="li" key={key}>
            <SiteHierarchy site={site} />
          </Box>
        ))}
      </Box>
    </>
  );
});

const SiteHierarchy: React.FunctionComponent<{
  site: Maybe<PSite>;
}> = observer(({ site }) => {
  return (
    <>
      <Heading level="2">Locatie: {site.name}</Heading>
      <Box as="ul" margin={{ left: 'medium' }}>
        {/* <li>Count: {Object.keys(site.buildings).length}</li> */}
        {/* <li>Keys: {Array.from(getKeys(site) || []).join('/')}</li> */}
        {/* <li>Path: {(getPath(site.buildings) || []).join('/')}</li> */}
        {Object.entries(site.buildings).map(([key, building]) => (
          <Box as="li" key={key}>
            <BuildingHierarchy building={building} />
          </Box>
        ))}
      </Box>
    </>
  );
});

const BuildingHierarchy: React.FunctionComponent<{
  building: Maybe<PBuilding>;
}> = observer(({ building }) => {
  return (
    <>
      <Heading level="3">Gebouw: {building.name}</Heading>
      <Box as="ul" margin={{ left: 'medium' }}>
        {Object.entries(building.buildingStoreys).map(
          ([key, buildingStorey]) => (
            <Box as="li" key={key}>
              <Heading level="4">Verdieping: {buildingStorey.name}</Heading>
            </Box>
          )
        )}
      </Box>
    </>
  );
});
