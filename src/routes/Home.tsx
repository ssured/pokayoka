import { RouteComponentProps, Link } from '@reach/router';
import React from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';

import { Box, Grid, Menu, Anchor } from 'grommet';
import { SettingsOption, Projects, Book } from 'grommet-icons';

// import { NLSfB } from '../components/NLSfB';

import { useAuthentication } from '../contexts/authentication';

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
        <Anchor icon={<SettingsOption />} href="#" />
      </Box>
      <Box fill align="center" justify="center">
        <Box direction="column">
          <Box pad="small">
            <Anchor
              icon={<Projects size="medium" />}
              href="/projects"
              label="Projecten"
            />
          </Box>
          <Box pad="small">
            <Anchor
              icon={<Book size="medium" />}
              href="/manuals"
              label="Instructies"
            />
          </Box>
          <pre>
            Todo: - override Grommet Anchor onClick to navigate to href. Does
            postback now
          </pre>
        </Box>
      </Box>
    </Box>
  );
});
