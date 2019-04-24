import React from 'react';
import { Maybe } from '../../../utils/universe';
import { observer } from 'mobx-react-lite';
import { Hierarchy } from './Hierarchy';
import { Page, PageTitle } from '../../../components/Page/Page';
import { Todo } from '../../../layout/Todo';
import { RoutedButton } from '../../../layout/RoutedButton';
import { SettingsOption, Schedules, Bug, Disc } from 'grommet-icons';
import { router } from '../../../router';
import { Route } from 'boring-router-react';
import { TileGrid } from '../../../layout/TileGrid';
import { Box } from 'grommet';
import { Snags } from './Snags';

const Avatar: React.FunctionComponent<{ name: string }> = ({ name }) => (
  <Box round border pad="xsmall">
    SS
  </Box>
);

export const Detail: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  return (
    <>
      <PageTitle prefix="Project" title={project.name} href="/hello">
        <Page
          leftOfTitle={<Disc size="large" />}
          rightOfTitle={<Avatar name="SS" />}
        >
          <Route match={router.projects.projectId} exact>
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
          </Route>

          <Route match={router.projects.projectId.settings} exact>
            <RoutedButton
              to={router.projects.projectId}
              label="Project home"
              plain={false}
            />
          </Route>

          <Route match={router.projects.projectId.snags} exact>
            <Snags project={project} />
          </Route>
        </Page>
      </PageTitle>
      {/* <h1>Projectnaam: {project.name} </h1>
      <ul>
        {Object.entries(project.sites).map(([key, site]) => (
          <li key={key}>{site.name}</li>
        ))}
      </ul> */}
      <Hierarchy project={project} />
    </>
  );
});
