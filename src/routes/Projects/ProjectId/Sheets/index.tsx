import { Route } from 'boring-router-react';
import { Box } from 'grommet';
import { observer, useObservable } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { Page, PageTitle } from '../../../../components/Page/Page';
import { RoutedButton } from '../../../../layout/RoutedButton';
import { BuildingStoreyTile } from '../../../../model/BuildingStorey/BuildingStoreyTile';
import { router } from '../../../../router';
import { Maybe } from '../../../../utils/universe';
import { PProjectContext } from '../Detail';
import { BuildingStorey } from './BuildingStorey';

const currentRoute = router.projects.projectId.sheets;

export const Sheets: React.FunctionComponent<{
  project?: Maybe<PProject>;
}> = observer(({ project = useContext(PProjectContext) }) => {
  const data = useObservable({
    get storeysWithActiveSheet(): PBuildingStorey[] {
      return Object.values(project.sites)
        .flatMap(site => Object.values(site.buildings))
        .flatMap(building => Object.values(building.buildingStoreys))
        .filter(
          storey => storey.activeSheet && storey.activeSheet.$thumb != null
        ) as PBuildingStorey[];
    },
    // _activeSheet: undefined as PSheet | undefined,
    // get activeSheet(): PSheet | undefined {
    //   return this._activeSheet || this.availableSheets[0];
    // },
  });

  return (
    <>
      <Route match={currentRoute} exact>
        <Page>
          <Box direction="row" wrap>
            {data.storeysWithActiveSheet
              .filter(storey => storey.identifier != null)
              .map(storey => (
                <BuildingStoreyTile
                  key={storey.identifier}
                  buildingStorey={storey}
                >
                  <RoutedButton
                    to={currentRoute.buildingStoreyId}
                    params={{ buildingStoreyId: storey.identifier }}
                    label="Open plattegrond"
                    plain={false}
                  />
                </BuildingStoreyTile>
              ))}
          </Box>
        </Page>
      </Route>

      <Route match={currentRoute.buildingStoreyId} exact>
        {(() => {
          const storey = data.storeysWithActiveSheet.find(
            storey =>
              storey.identifier ===
              currentRoute.buildingStoreyId.$params.buildingStoreyId
          );

          return storey ? (
            <PageTitle title={[[storey.name]]}>
              <BuildingStorey buildingStorey={storey} />
            </PageTitle>
          ) : (
            <>Storey niet gevonden</>
          );
        })()}
      </Route>
    </>
  );
});
