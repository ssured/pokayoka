import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { RouteComponentProps } from '@reach/router';

import { Box, Heading } from 'grommet';
import { useProjectId } from './index';
import { useModel } from '../../contexts/store';
import { Project } from '../../models/Project';
import { ISite } from '../../models/Site';
import { IBuilding } from '../../models/Building';
import { IBuildingStorey } from '../../models/BuildingStorey';
import { ISpace } from '../../models/Space';

const LoadingIndicator = () => <p>Loading...</p>;
const ErrorMessage = (error: Error) => (
  <h3>Uh oh, something happened {error.message}</h3>
);

const Space: React.SFC<{ space: ISpace }> = ({ space }) =>
  useObserver(() => (
    <>
      <Heading>Space: {space.name}</Heading>
      {space.facts.fold(
        () => (
          <p>...</p>
        ),
        facts => (
          <p>{facts.length} facts</p>
        ),
        ErrorMessage
      )}
    </>
  ));

const SpacesList: React.SFC<{ spaces: ISpace[] }> = ({ spaces }) =>
  useObserver(() => (
    <>
      <Heading>{spaces.length} spaces gevonden:</Heading>
      <ul>
        {spaces.map(space => (
          <Space key={space.id} space={space} />
        ))}
      </ul>
    </>
  ));

const BuildingStorey: React.SFC<{ buildingStorey: IBuildingStorey }> = ({
  buildingStorey,
}) =>
  useObserver(() => (
    <>
      <Heading>BuildingStorey: {buildingStorey.name}</Heading>

      {buildingStorey.spaces.fold(
        LoadingIndicator,
        spaces => SpacesList({ spaces }),
        ErrorMessage
      )}
    </>
  ));

const BuildingStoreysList: React.SFC<{
  buildingStoreys: IBuildingStorey[];
}> = ({ buildingStoreys }) =>
  useObserver(() => (
    <>
      <Heading>{buildingStoreys.length} buildingStoreys gevonden:</Heading>
      <ul>
        {buildingStoreys.map(buildingStorey => (
          <BuildingStorey
            key={buildingStorey.id}
            buildingStorey={buildingStorey}
          />
        ))}
      </ul>
    </>
  ));

const Building: React.SFC<{ building: IBuilding }> = ({ building }) =>
  useObserver(() => (
    <>
      <Heading>Building: {building.name}</Heading>

      {building.storeys.fold(
        LoadingIndicator,
        buildingStoreys => BuildingStoreysList({ buildingStoreys }),
        ErrorMessage
      )}
    </>
  ));

const BuildingsList: React.SFC<{ buildings: IBuilding[] }> = ({ buildings }) =>
  useObserver(() => (
    <>
      <Heading>{buildings.length} buildings gevonden:</Heading>
      <ul>
        {buildings.map(building => (
          <Building key={building.id} building={building} />
        ))}
      </ul>
    </>
  ));

const Site: React.SFC<{ site: ISite }> = ({ site }) =>
  useObserver(() => (
    <>
      <Heading>Site: {site.name}</Heading>

      {site.buildings.fold(
        LoadingIndicator,
        buildings => BuildingsList({ buildings }),
        ErrorMessage
      )}
    </>
  ));
const SitesList: React.SFC<{ sites: ISite[] }> = ({ sites }) =>
  useObserver(() => (
    <>
      <Heading>{sites.length} sites gevonden:</Heading>
      <ul>
        {sites.map(site => (
          <Site key={site.id} site={site} />
        ))}
      </ul>
    </>
  ));

export const Overview: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => {
  const projectId = useProjectId();
  const project = useModel(Project, projectId);

  return useObserver(() => (
    <Box>
      {project.fold(
        LoadingIndicator,
        project => (
          <>
            <Heading>Project {project.name}</Heading>

            {project.sites.fold(
              LoadingIndicator,
              sites => SitesList({ sites }),
              ErrorMessage
            )}
          </>
        ),
        ErrorMessage
      )}
    </Box>
  ));
};
