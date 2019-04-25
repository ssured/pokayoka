import { Route } from 'boring-router-react';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Page } from '../../../../../../../components/Page/Page';
import { router } from '../../../../../../../router';
import { Maybe } from '../../../../../../../utils/universe';
import { Settings } from './Settings';

export const BuildingStoreyId: React.FunctionComponent<{
  buildingStorey: Maybe<PBuildingStorey>;
}> = observer(({ buildingStorey }) => {
  return (
    <>
      <Route match={router.projects.projectId.settings.siteId.buildingId} exact>
        <Page>
          <Settings buildingStorey={buildingStorey} />
        </Page>
      </Route>

      {/* <Route
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
                buildingStorey.buildingStoreys[
                  router.projects.projectId.settings.siteId.buildingId
                    .buildingStoreyId.$params.buildingStoreyId
                ]
              ),
            ],
          ]}
        >
          <BuildingStoreyId
            buildingStorey={
              buildingStorey.buildingStoreys[
                router.projects.projectId.settings.siteId.buildingId
                  .buildingStoreyId.$params.buildingStoreyId
              ]
            }
          />
        </PageTitle>
      </Route>{' '} */}
    </>
  );
});
