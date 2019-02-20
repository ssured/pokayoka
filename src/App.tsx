import React from 'react';
import { Router, navigate } from '@reach/router';

import { Home } from './routes/Home';
import { Project } from './routes/Project';

import { CapabilitiesCheck } from './components/CapabilitiesCheck';
import { LoginForm } from './components/LoginForm/index';
import { useAuthentication } from './contexts/authentication';
import { Grommet, Grid, Box, Button, Text } from 'grommet';
import { Menu, Home as HomeIcon, Sync } from 'grommet-icons';
import { useToggle } from 'react-use';

export const App: React.SFC<{}> = ({}) => {
  const {
    isAuthenticated,
    login,
    authentication,
    logout,
  } = useAuthentication();
  const [sidebar, toggleSidebar] = useToggle(true);
  return (
    <CapabilitiesCheck>
      {!isAuthenticated && (
        <LoginForm
          onAuthentication={(name, roles) => login({ ok: true, name, roles })}
        />
      )}

      {isAuthenticated && (
        <Grommet full>
          <Grid
            fill
            rows={['auto', 'flex']}
            columns={['flex', 'auto']}
            areas={[
              { name: 'header', start: [0, 0], end: [1, 0] },
              { name: 'main', start: [0, 1], end: [0, 1] },
              { name: 'sidebar', start: [1, 1], end: [1, 1] },
            ]}
          >
            <Box
              gridArea="header"
              direction="row"
              align="center"
              justify="between"
              pad="medium"
              background="dark-2"
            >
              <Text onClick={() => navigate('/')}>Pokayoka</Text>

              <Button
                plain
                focusIndicator={false}
                icon={<Menu />}
                label={authentication.ok ? authentication.name : 'Anonymous'}
                reverse
                hoverIndicator
                onClick={() => toggleSidebar()}
              />
            </Box>
            {sidebar && (
              <Box
                gridArea="sidebar"
                background="dark-3"
                width="small"
                animation={[
                  { type: 'fadeIn', duration: 300 },
                  { type: 'slideLeft', size: 'xlarge', duration: 150 },
                ]}
              >
                <Button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  hoverIndicator
                >
                  <Box direction="row" justify="between" pad="small">
                    <Text>Logout</Text>
                  </Box>
                </Button>

                <Button onClick={() => navigate('/sync')} hoverIndicator>
                  <Box direction="row" justify="between" pad="small">
                    <Text>Sync</Text>
                    <Sync />
                  </Box>
                </Button>

                {['First', 'Second', 'Third'].map(name => (
                  <Button
                    key={name}
                    href="#"
                    // icon={<HomeIcon />}
                    hoverIndicator
                  >
                    <Box direction="row" justify="between" pad="small">
                      <Text>
                        {name} {name} {name}
                      </Text>
                      <HomeIcon />
                    </Box>
                  </Button>
                ))}
              </Box>
            )}
            <Box gridArea="main" justify="center" align="center">
              <Router>
                <Home path="/" />
                {/* <Debug path="debug" /> */}
                {/* <SyncStatus path="sync" /> */}
                <Project path=":projectId" />

                {/* <User path=":userId">
                  <Project path=":projectId" />
                </User> */}
              </Router>
            </Box>
          </Grid>
        </Grommet>
      )}
    </CapabilitiesCheck>
  );
};
