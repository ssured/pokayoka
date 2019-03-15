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

const Space: React.SFC<{ space: ISpace }> = ({ space }) => (
  <>
    <Heading>Space: {space.name}</Heading>
  </>
);

const SpacesList: React.SFC<{ spaces: ISpace[] }> = ({ spaces }) => (
  <>
    <Heading>{spaces.length} spaces gevonden:</Heading>
    <ul>
      {spaces.map(space => (
        <Space key={space.id} space={space} />
      ))}
    </ul>
  </>
);

const BuildingStorey: React.SFC<{ buildingStorey: IBuildingStorey }> = ({
  buildingStorey,
}) => (
  <>
    <Heading>BuildingStorey: {buildingStorey.name}</Heading>

    {buildingStorey.spaces.fold(
      LoadingIndicator,
      spaces => SpacesList({ spaces }),
      ErrorMessage
    )}
  </>
);

const BuildingStoreysList: React.SFC<{
  buildingStoreys: IBuildingStorey[];
}> = ({ buildingStoreys }) => (
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
);

const Building: React.SFC<{ building: IBuilding }> = ({ building }) => (
  <>
    <Heading>Building: {building.name}</Heading>

    {building.storeys.fold(
      LoadingIndicator,
      buildingStoreys => BuildingStoreysList({ buildingStoreys }),
      ErrorMessage
    )}
  </>
);

const BuildingsList: React.SFC<{ buildings: IBuilding[] }> = ({
  buildings,
}) => (
  <>
    <Heading>{buildings.length} buildings gevonden:</Heading>
    <ul>
      {buildings.map(building => (
        <Building key={building.id} building={building} />
      ))}
    </ul>
  </>
);

const Site: React.SFC<{ site: ISite }> = ({ site }) => (
  <>
    <Heading>Site: {site.name}</Heading>

    {site.buildings.fold(
      LoadingIndicator,
      buildings => BuildingsList({ buildings }),
      ErrorMessage
    )}
  </>
);
const SitesList: React.SFC<{ sites: ISite[] }> = ({ sites }) => (
  <>
    <Heading>{sites.length} sites gevonden:</Heading>
    <ul>
      {sites.map(site => (
        <Site key={site.id} site={site} />
      ))}
    </ul>
  </>
);

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
