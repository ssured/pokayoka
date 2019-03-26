import { RouteComponentProps, Link } from '@reach/router';
import React from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';

import { Box, Grid, Menu } from 'grommet';
import { SettingsOption, Projects, Book } from 'grommet-icons';

// import { NLSfB } from '../components/NLSfB';

import { useAuthentication } from '../contexts/authentication';
import { RouteLink } from '../components/ui/RouteLink';

interface HomeParams {}
export const Home = observer((props: RouteComponentProps<HomeParams>) => {
  const { authentication, logout } = useAuthentication();

  return (
    <Box direction="column" fill="vertical">
      <Box direction="row" fill="horizontal" justify="between">
        {/* User */}
        {authentication.ok && (
          <Menu
            dropAlign={{ top: 'bottom', left: 'left' }}
            label={authentication.name}
            items={[
              { label: 'Accountbeheer', onClick: () => {} },
              {
                label: 'Uitloggen',
                onClick: () => {
                  logout();
                },
              },
            ]}
          />
        )}

        {/* Settings */}
        <RouteLink icon={<SettingsOption />} href="#" />
      </Box>
      <Box fill align="center" justify="center">
        <Box direction="column">
          <Box pad="small">
            <RouteLink
              icon={<Projects size="medium" />}
              href="/projects"
              label="Projecten"
            />
          </Box>
          <Box pad="small">
            <RouteLink
              icon={<Book size="medium" />}
              href="/manuals"
              label="Instructies"
            />
          </Box>
          <pre>Todo:</pre>
        </Box>
      </Box>
    </Box>
  );
});
