import { Route } from 'boring-router-react';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Page, PageTitle } from '../../../../../../components/Page/Page';
import { router } from '../../../../../../router';
import { Maybe } from '../../../../../../utils/universe';
import { Settings } from './Settings';
import { RoutedButton } from '../../../../../../layout/RoutedButton';
import { BuildingStoreyId } from './BuildingStoreyId/index';

export const BuildingId: React.FunctionComponent<{
  building: Maybe<PBuilding>;
}> = observer(({ building }) => {
  return (
    <>
      <Route match={router.projects.projectId.settings.siteId.buildingId} exact>
        <Page>
          <Settings building={building} />
        </Page>
      </Route>
      <Route
        match={
          router.projects.projectId.settings.siteId.buildingId.buildingStoreyId
        }
      >
        <PageTitle
          title={[
            [
              (building => (
                <RoutedButton
                  to={
                    router.projects.projectId.settings.siteId.buildingId
                      .buildingStoreyId
                  }
                  label={`Gebouw: ${building.name}`}
                  active={false}
                />
              ))(
                building.buildingStoreys[
                  router.projects.projectId.settings.siteId.buildingId
                    .buildingStoreyId.$params.buildingStoreyId
                ]
              ),
            ],
          ]}
        >
          <BuildingStoreyId
            buildingStorey={
              building.buildingStoreys[
                router.projects.projectId.settings.siteId.buildingId
                  .buildingStoreyId.$params.buildingStoreyId
              ]
            }
          />
        </PageTitle>
      </Route>{' '}
    </>
  );
});
