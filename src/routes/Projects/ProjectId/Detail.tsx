import { Route } from 'boring-router-react';
import { Box, Text } from 'grommet';
import {
  Apps,
  Bug,
  Disc,
  Schedules,
  SettingsOption,
  UserSettings,
  MapLocation,
} from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React, { createContext } from 'react';
import { Page, PageCrumb, PageTitle } from '../../../components/Page/Page';
import { RoutedButton } from '../../../layout/RoutedButton';
import { TileGrid } from '../../../layout/TileGrid';
import { Todo } from '../../../layout/Todo';
import { router } from '../../../router';
import { Maybe } from '../../../utils/universe';
import { Snags } from './Snags';
import { Settings } from './Settings/index';
import { Sheets } from './Sheets/index';

const Avatar: React.FunctionComponent<{ name: string }> = ({ name }) => (
  <Box round border pad="xsmall">
    {name}
  </Box>
);

const currentRoute = router.projects.projectId;

export const PProjectContext = createContext<Maybe<PProject>>(null as any);

export const Detail: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  return (
    <PProjectContext.Provider value={project}>
      <PageTitle
        title={[
          [
            <RoutedButton
              key="a0"
              to={currentRoute}
              active={false}
              label={project.name}
            />,
          ],
          [
            <Apps key="a1" />,
            <Box key="a2" direction="row" gap="medium">
              <RoutedButton
                to={currentRoute.sheets}
                active={false}
                label={
                  <Box
                    fill
                    justify="center"
                    align="center"
                    direction="column"
                    gap="small"
                    animation="slideDown"
                    pad="small"
                  >
                    <MapLocation />
                    <Text size="small">Plattegronden</Text>
                  </Box>
                }
              />

              <RoutedButton
                to={currentRoute.snags}
                active={false}
                label={
                  <Box
                    fill
                    justify="center"
                    align="center"
                    direction="column"
                    gap="small"
                    animation="slideDown"
                    pad="small"
                  >
                    <Bug />
                    <Text size="small">Bevindingen</Text>
                  </Box>
                }
              />

              <RoutedButton
                to={currentRoute.settings}
                active={false}
                label={
                  <Box
                    fill
                    justify="center"
                    align="center"
                    direction="column"
                    gap="small"
                    animation="slideDown"
                    pad="small"
                  >
                    <UserSettings />
                    <Text size="small">Projectbeheer</Text>
                  </Box>
                }
              />
            </Box>,
          ],
        ]}
      >
        <Route match={currentRoute} exact>
          <Page
            leftOfTitle={<Disc size="large" />}
            rightOfTitle={<Avatar name="SS" />}
          >
            <Todo>
              <RoutedButton
                to={currentRoute.settings}
                icon={<SettingsOption />}
                label="Project instellingen"
                plain={false}
              />
            </Todo>
            <TileGrid>
              <Box
                fill
                justify="center"
                align="center"
                direction="column"
                gap="medium"
              >
                <Bug size="xlarge" />
                <RoutedButton
                  to={currentRoute.snags}
                  label="Bevindingen"
                  plain={false}
                />
              </Box>

              <Box
                fill
                align="center"
                justify="center"
                direction="column"
                gap="medium"
              >
                <Schedules size="xlarge" />
                Planning
              </Box>
            </TileGrid>
          </Page>
        </Route>

        <Route match={currentRoute.settings}>
          <PageCrumb
            title={
              <RoutedButton
                to={currentRoute.settings}
                active={false}
                label={'Projectbeheer'}
              />
            }
          >
            <Settings project={project} />
          </PageCrumb>
        </Route>

        <Route match={currentRoute.snags} exact>
          <Snags project={project} />
        </Route>

        <Route match={currentRoute.sheets}>
          <PageCrumb
            title={
              <RoutedButton
                to={currentRoute.sheets}
                active={false}
                label={'Plattegronden'}
              />
            }
          >
            <Sheets />
          </PageCrumb>
        </Route>
        {/* <h1>Projectnaam: {project.name} </h1>
      <ul>
        {Object.entries(project.sites).map(([key, site]) => (
          <li key={key}>{site.name}</li>
        ))}
      </ul> */}
        {/* <Hierarchy project={project} /> */}
      </PageTitle>
    </PProjectContext.Provider>
  );
});
