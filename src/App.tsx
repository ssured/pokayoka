import React, { useContext, ReactNode } from 'react';
import { Grid, Button, ResponsiveContext, Box, Heading, Text } from 'grommet';

import styled from 'styled-components';
import {
  Menu,
  Close,
  Disc,
  Projects as ProjectsIcon,
  Book,
  Home as HomeIcon,
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
import { GunComponent } from './routes/Gun';

import { Router, RouteMatch } from 'boring-router';
import { createBrowserHistory } from 'history';
import { Link, Route, NavLink } from 'boring-router-react';
import { observer } from 'mobx-react-lite';
import { RoutedButton } from './layout/RoutedButton';

const history = createBrowserHistory();

export const router = Router.create(
  {
    home: {
      $match: '',
    },
    gun: true,
    projects: {
      $exact: true,
      $children: {
        id: {
          $match: RouteMatch.segment,
        },
      },
    },
    notFound: {
      $match: RouteMatch.rest,
    },
  },
  history
);

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
  const UI = useUIContext();

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
                <h1>HOME sweet home</h1>
                <Link to={router.projects}>Accounts</Link>
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

              <Route match={router.gun}>
                <GunComponent />
              </Route>

              <Route match={router.projects} exact>
                <p>Account page</p>
                <Link to={router.home}>Home</Link>
                <Link to={router.projects.id} params={{ id: '123' }}>
                  Account 123
                </Link>

                <RoutedButton to={router.projects}>TEST</RoutedButton>

                <RoutedButton
                  to={router.projects.id}
                  params={{ id: '123' }}
                  label="TEST"
                />
              </Route>

              <Route match={router.projects.id}>
                <p>Account {router.projects.id.$params.id} details page</p>
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
