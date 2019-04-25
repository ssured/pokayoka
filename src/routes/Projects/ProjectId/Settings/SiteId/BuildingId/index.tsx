import { Route } from 'boring-router-react';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Page, PageTitle } from '../../../../../../components/Page/Page';
import { RoutedButton } from '../../../../../../layout/RoutedButton';
import { router } from '../../../../../../router';
import { Maybe } from '../../../../../../utils/universe';
import { AddBuildingStorey } from './AddBuildingStorey';
import { BuildingStoreyId } from './BuildingStoreyId/index';
import { Settings } from './Settings';

const currentRoute = router.projects.projectId.settings.siteId.buildingId;

export const BuildingId: React.FunctionComponent<{
  building: Maybe<PBuilding>;
}> = observer(({ building }) => {
  return (
    <>
      <Route match={currentRoute} exact>
        <Page>
          <Settings building={building} />
        </Page>
      </Route>
      <Route match={currentRoute.addBuildingStorey} exact>
        <PageTitle title={[['Verdieping toevoegen']]}>
          <Page>
            <AddBuildingStorey
              onSubmit={async buildingStorey => {
                building.buildingStoreys[
                  buildingStorey.identifier
                ] = buildingStorey;

                currentRoute.buildingStoreyId.$replace({
                  buildingStoreyId: buildingStorey.identifier,
                });
              }}
            />
          </Page>
        </PageTitle>
      </Route>
      <Route match={currentRoute.buildingStoreyId}>
        <PageTitle
          title={[
            [
              (buildingStorey => (
                <RoutedButton
                  to={currentRoute.buildingStoreyId}
                  label={`Verdieping: ${buildingStorey.name}`}
                  active={false}
                />
              ))(
                building.buildingStoreys[
                  currentRoute.buildingStoreyId.$params.buildingStoreyId
                ]
              ),
            ],
          ]}
        >
          <BuildingStoreyId
            buildingStorey={
              building.buildingStoreys[
                currentRoute.buildingStoreyId.$params.buildingStoreyId
              ]
            }
          />
        </PageTitle>
      </Route>
    </>
  );
});
