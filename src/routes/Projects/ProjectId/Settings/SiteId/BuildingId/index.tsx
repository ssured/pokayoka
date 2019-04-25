import { Route } from 'boring-router-react';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Page, PageTitle } from '../../../../../../components/Page/Page';
import { router } from '../../../../../../router';
import { Maybe } from '../../../../../../utils/universe';
import { Settings } from './Settings';
import { RoutedButton } from '../../../../../../layout/RoutedButton';

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
    </>
  );
});
