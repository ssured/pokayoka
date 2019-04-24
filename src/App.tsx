import React, { useContext } from 'react';
import { Grid, Button, ResponsiveContext, Box, Text } from 'grommet';

import {
  Menu,
  Close,
  Disc,
  Projects as ProjectsIcon,
  Home as HomeIcon,
  UserSettings,
} from 'grommet-icons';

import { Home } from './routes/Home';
import { Projects } from './routes/Projects';

import { CapabilitiesCheck } from './components/CapabilitiesCheck';
import { LoginForm } from './components/LoginForm/index';
import { useAuthentication } from './contexts/authentication';
import { useToggle } from 'react-use';

import { MenuItemButton, ButtonLiner } from './UI/components/context-menu';
import { useUIContext, useNewUIContext } from './contexts/ui';
import { Site } from './routes/Sites/Site/index';
import { Building } from './routes/Buildings/Building/index';
import { BuildingStorey } from './routes/BuildingStoreys/BuildingStorey/index';
import { Sheet } from './routes/Sheets/Sheet/index';
import { Sync } from './routes/Sync/index';
import { Tree } from './routes/Tree/index';
import { Columns } from './routes/Columns/index';
import { ProjectPage } from './routes/Paged/ProjectPage';
import { Sidebar, SidebarMenuItem } from './layout/Sidebar';

import { Link, Route } from 'boring-router-react';
import { observer } from 'mobx-react-lite';
import { RoutedButton } from './layout/RoutedButton';
import { User } from './routes/User';
import { New as NewProject } from './routes/Projects/New';
import { Detail } from './routes/Projects/Project/Detail';
import { useRoot } from './contexts/spo-hub';
import { router } from './router';

/*
Router:

/
  = Home
  - Toont lijst van projecten voor ingelogde gebruiker
/user/:userId -> gebruikersinformatie
/company/:companyId -> bedrijfsinformatie

/:projectIdOrSlug --> kan eventueel publiek toegankelijk zijn
  = Beginscherm project
  - dashboard

/:projectIdOrSlug/plan voor planning (post mvp)
/:projectIdOrSlug/guide voor checklists en installatie
  
/:projectIdOrSlug/observations voor vastgelegde punten 
Parameters:
- filter: status, label, hierarchie, nlsfb element, verantwoordelijke, eindverantwoordelijk, datum
- sort: datum nieuw, datum laatste aanpassing, doeldatum taak, vrij gesorteerd + asc/desc

automatische forward van index weergave
/:projectIdOrSlug/observations => /:projectIdOrSlug/observations/(=projectId)/list

/:projectIdOrSlug/observations/:hierarchyId/map/:sheetId
/:projectIdOrSlug/observations/:hierarchyId/list
Parameters:
- selected?: observationId

/:projectIdOrSlug/observations/:hierarchyId/new
/:projectIdOrSlug/observation/:observationId

*/

const NotFound: React.FunctionComponent<{}> = () => {
  return (
    <>
      <p>Not Found</p>
      <Link to={router.home}>Home</Link>
    </>
  );
};

export const App: React.FunctionComponent<{}> = observer(() => {
  const {
    isAuthenticated,
    login,
    authentication,
    logout,
  } = useAuthentication();
  const newUIContext = useNewUIContext({
    navContext: { label: 'Home', path: '/' },
  });

  const size = useContext(ResponsiveContext);
  const [showSidebar, toggleSidebar] = useToggle(true);

  const user = useRoot();

  return (
    <newUIContext.Provider>
      <CapabilitiesCheck>
        {!isAuthenticated ? (
          <LoginForm
            onAuthentication={(name, roles) => login({ ok: true, name, roles })}
          />
        ) : (
          <Grid
            fill="horizontal"
            style={{ minHeight: '100%' }}
            columns={['flex', 'auto']}
            rows={['auto', 'flex', 'auto']}
            areas={[
              { name: 'header', start: [0, 0], end: [1, 0] },
              { name: 'content', start: [0, 1], end: [0, 1] },
              { name: 'footer', start: [0, 2], end: [0, 2] },
              { name: 'nav', start: [1, 1], end: [1, 2] },
            ]}
          >
            <Box
              gridArea="header"
              direction="row"
              justify="between"
              align="center"
              background="neutral-2"
            >
              <Box direction="row" justify="center" margin={{ left: 'small' }}>
                <Disc />
                <Box pad={{ left: 'small' }}>
                  <Text weight="bold">Pokayoka</Text>
                </Box>
              </Box>
              <Button
                gridArea="burger"
                icon={showSidebar ? <Close /> : <Menu />}
                onClick={() => toggleSidebar()}
              />
            </Box>
            <Box
              gridArea="content"
              pad={size === 'small' ? undefined : 'medium'}
              // overflow={{ vertical: 'scroll' }}
            >
              <Route match={router.home}>
                <Home />
              </Route>
              {/* <Home path="/" /> */}
              {/* <Sync path="sync" /> */}
              {/* <Projects path="projects/*" />
              <Site path="sites/:siteId/*" />
              <Building path="buildings/:buildingId/*" />
              <BuildingStorey path="buildingStoreys/:buildingStoreyId/*" />
              <Sheet path="sheets/:sheetId/*" /> */}

              {/* <Tree path="tree" /> */}
              {/* <Columns path="columns/:projectCode" /> */}
              {/* <ProjectPage path="paged/:projectCode/*" /> */}

              <Route match={router.account}>
                <User />
              </Route>

              <Route match={router.projects} exact>
                <p>Account page</p>
                <Link to={router.home}>Home</Link>
                <Link
                  to={router.projects.projectId}
                  params={{ projectId: '123' }}
                >
                  Account 123
                </Link>

                <RoutedButton to={router.projects}>TEST</RoutedButton>

                <RoutedButton
                  to={router.projects.id}
                  params={{ id: '123' }}
                  label="TEST"
                />
              </Route>

              <Route match={router.projects.new} exact>
                <NewProject
                  afterCreate={project => {
                    router.projects.projectId.$push({
                      projectId: project.identifier,
                    });
                  }}
                />
              </Route>

              <Route match={router.projects.projectId}>
                <Detail
                  project={user.projects[
                    router.projects.projectId.$params.projectId
                  ]()}
                />
              </Route>

              <Route match={router.notFound}>
                <NotFound />
              </Route>
              {/* <NotFound default /> */}
              {/* <User path=":userId">
                  <Project path=":projectId" />
                </User>  */}
            </Box>
            <Box gridArea="footer">footer</Box>

            <Box gridArea="nav">
              {showSidebar && (
                <Sidebar
                  onToggleSidebar={() => toggleSidebar()}
                  items={[
                    {
                      icon: <HomeIcon />,
                      route: router.home,
                      label: 'Home',
                    },
                    {
                      icon: <ProjectsIcon />,
                      route: router.projects,
                      label: 'Projecten',
                    },
                    {
                      icon: <UserSettings />,
                      route: router.account,
                      label: 'Account',
                    },
                  ]}
                />
              )}
            </Box>
          </Grid>
        )}
      </CapabilitiesCheck>
    </newUIContext.Provider>
  );
});
