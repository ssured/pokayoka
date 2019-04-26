import { Box } from 'grommet';
import { observer, useObservable } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { Page, PageTitle } from '../../../../components/Page/Page';
import { Maybe } from '../../../../utils/universe';
import { PProjectContext } from '../Detail';
import { Route } from 'boring-router-react';
import { router } from '../../../../router';
import { SheetTile } from '../../../../model/Sheet/SheetTile';
import { RoutedButton } from '../../../../layout/RoutedButton';
import { Sheet } from './Sheet';

const currentRoute = router.projects.projectId.sheets;

export const Sheets: React.FunctionComponent<{
  project?: Maybe<PProject>;
}> = observer(({ project = useContext(PProjectContext) }) => {
  const data = useObservable({
    get availableSheets(): PSheet[] {
      return Object.values(project.sites)
        .flatMap(site => Object.values(site.buildings))
        .flatMap(building => Object.values(building.buildingStoreys))
        .flatMap(storey => Object.values(storey.sheets))
        .filter(sheet => sheet != null) as PSheet[];
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
            {data.availableSheets
              .filter(sheet => sheet.identifier != null)
              .map(sheet => (
                <SheetTile key={sheet.identifier} sheet={sheet}>
                  <RoutedButton
                    to={currentRoute.sheetId}
                    params={{ sheetId: sheet.identifier }}
                    label="Open plattegrond"
                    plain={false}
                  />
                </SheetTile>
              ))}
          </Box>
        </Page>
      </Route>

      <Route match={currentRoute.sheetId} exact>
        {(() => {
          const sheet = data.availableSheets.find(
            sheet => sheet.identifier === currentRoute.sheetId.$params.sheetId
          );

          return sheet ? (
            <PageTitle title={[[sheet.name]]}>
              <Sheet sheet={sheet} />
            </PageTitle>
          ) : (
            <>Sheet niet gevonden</>
          );
        })()}
      </Route>
    </>
  );
});
