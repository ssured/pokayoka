import React from 'react';
import { Maybe } from '../../../utils/universe';
import { observer } from 'mobx-react-lite';
import { Hierarchy } from './Hierarchy';
import { Page, PageTitle } from '../../../components/Page/Page';
import { Todo } from '../../../layout/Todo';
import { RoutedButton } from '../../../layout/RoutedButton';
import { SettingsOption, Schedules, Bug, Disc, Apps } from 'grommet-icons';
import { router } from '../../../router';
import { Route } from 'boring-router-react';
import { TileGrid } from '../../../layout/TileGrid';
import { Box, Text } from 'grommet';
import { Snags } from './Snags';
import { UserSettings } from 'grommet-icons';
import { Settings } from './Settings';

const Avatar: React.FunctionComponent<{ name: string }> = ({ name }) => (
  <Box round border pad="xsmall">
    {name}
  </Box>
);

export const Detail: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  return (
    <PageTitle
      title={[
        [
          <RoutedButton
            key="a0"
            to={router.projects.projectId}
            active={false}
            label={project.name}
          />,
        ],
        [
          <Apps key="a1" />,
          <Box key="a2" direction="row" gap="medium">
            <RoutedButton
              to={router.projects.projectId.snags}
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
              to={router.projects.projectId.settings}
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
      <Route match={router.projects.projectId} exact>
        <Page
          leftOfTitle={<Disc size="large" />}
          rightOfTitle={<Avatar name="SS" />}
        >
          <Todo>
            <RoutedButton
              to={router.projects.projectId.settings}
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
                to={router.projects.projectId.snags}
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

      <Route match={router.projects.projectId.settings} exact>
        <Settings project={project} />
      </Route>

      <Route match={router.projects.projectId.snags} exact>
        <Snags project={project} />
      </Route>
      {/* <h1>Projectnaam: {project.name} </h1>
      <ul>
        {Object.entries(project.sites).map(([key, site]) => (
          <li key={key}>{site.name}</li>
        ))}
      </ul> */}
      {/* <Hierarchy project={project} /> */}
    </PageTitle>
  );
});
