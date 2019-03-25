import { RouteComponentProps, Link } from '@reach/router';
import React from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';

import { Box, Grid, Menu, Anchor } from 'grommet';
import * as Icons from 'grommet-icons';

// import { NLSfB } from '../components/NLSfB';

import { useAuthentication } from '../contexts/authentication';
import { render } from 'react-dom';
import { jsx } from '../utils/nano';

const { SettingsOption } = Icons;

interface HomeParams {}
export const Home = observer((props: RouteComponentProps<HomeParams>) => {
  const { authentication, dbNames, logout } = useAuthentication();

  return (
    <Box direction="column" fill="vertical" pad="small">
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
      <Grid>
        {authentication.ok
          ? [...dbNames].map(db => (
              <Link key={db} to={`/${db}`}>
                <Box>{db}</Box>
              </Link>
            ))
          : 'Please connect to server to see your databases'}
      </Grid>
    </Box>
  );
});
