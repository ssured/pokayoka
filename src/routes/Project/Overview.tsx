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
import { IObservation } from '../../models/Observation';
import { Observation } from './Observation';

const LoadingIndicator = () => <p>Loading...</p>;
const ErrorMessage = (error: Error) => (
  <h3>Uh oh, something happened {error.message}</h3>
);

const ObservationsList: React.SFC<{ observations: IObservation[] }> = ({
  observations,
}) =>
  useObserver(() => (
    <>
      <p>{observations.length} facts gevonden:</p>
      <ul>
        {observations.map(observation => (
          <Observation key={observation.id} observation={observation} />
        ))}
      </ul>
    </>
  ));

const Space: React.SFC<{ space: ISpace }> = ({ space }) =>
  useObserver(() => (
    <>
      <Heading level="4">Space: {space.name}</Heading>
      {space.observations.fold(
        LoadingIndicator,
        observations => ObservationsList({ observations }),
        ErrorMessage
      )}
    </>
  ));

const SpacesList: React.SFC<{ spaces: ISpace[] }> = ({ spaces }) =>
  useObserver(() => (
    <>
      <p>{spaces.length} spaces gevonden:</p>
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
      <Heading level="3">BuildingStorey: {buildingStorey.name}</Heading>
      <p>
        sheets:
        {buildingStorey.sheets.value == null
          ? '?'
          : buildingStorey.sheets.value.length}{' '}
      </p>
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
      <p>{buildingStoreys.length} buildingStoreys gevonden:</p>
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
      <Heading>
        Building: {building.name} {building.id}
      </Heading>
      <p>
        sheets:
        {building.sheets.value == null
          ? '?'
          : building.sheets.value.length}{' '}
      </p>

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
      <p>{buildings.length} buildings gevonden:</p>
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
      <p>
        sheets:
        {site.sheets.value == null ? '?' : site.sheets.value.length}{' '}
      </p>

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
      <p>{sites.length} sites gevonden:</p>
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
