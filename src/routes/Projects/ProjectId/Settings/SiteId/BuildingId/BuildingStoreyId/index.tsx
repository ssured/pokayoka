import { Route } from 'boring-router-react';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Page, PageTitle } from '../../../../../../../components/Page/Page';
import { router } from '../../../../../../../router';
import { Maybe } from '../../../../../../../utils/universe';
import { Settings } from './Settings';
import { AddSheet } from './AddSheet';

const currentRoute =
  router.projects.projectId.settings.siteId.buildingId.buildingStoreyId;

export const BuildingStoreyId: React.FunctionComponent<{
  buildingStorey: Maybe<PBuildingStorey>;
}> = observer(({ buildingStorey }) => {
  return (
    <>
      <Route match={currentRoute} exact>
        <Page>
          <Settings buildingStorey={buildingStorey} />
        </Page>
      </Route>

      <Route match={currentRoute.addSheet} exact>
        <PageTitle title={[['Plattegrond toevoegen']]}>
          <Page>
            <AddSheet
              onSubmit={async sheet => {
                buildingStorey.sheets[sheet.identifier] = sheet;
                currentRoute.$replace();
              }}
            />
          </Page>
        </PageTitle>
      </Route>

      {/* <Route
        match={
          currentRoute
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
