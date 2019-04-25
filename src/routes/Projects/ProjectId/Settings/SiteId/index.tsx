import { Route } from 'boring-router-react';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Page, PageTitle } from '../../../../../components/Page/Page';
import { router } from '../../../../../router';
import { Maybe } from '../../../../../utils/universe';
import { Settings } from './Settings';
import { RoutedButton } from '../../../../../layout/RoutedButton';
import { BuildingId } from './BuildingId/index';

export const SiteId: React.FunctionComponent<{
  site: Maybe<PSite>;
}> = observer(({ site }) => {
  return (
    <>
      <Route match={router.projects.projectId.settings.siteId} exact>
        <Page>
          <Settings site={site} />
        </Page>
      </Route>

      <Route match={router.projects.projectId.settings.siteId.buildingId}>
        <PageTitle
          title={[
            [
              (building => (
                <RoutedButton
                  to={router.projects.projectId.settings.siteId.buildingId}
                  label={`Gebouw: ${building.name}`}
                  active={false}
                />
              ))(
                site.buildings[
                  router.projects.projectId.settings.siteId.buildingId.$params
                    .buildingId
                ]
              ),
            ],
          ]}
        >
          <BuildingId
            building={
              site.buildings[
                router.projects.projectId.settings.siteId.buildingId.$params
                  .buildingId
              ]
            }
          />
        </PageTitle>
      </Route>
    </>
  );
});
