import { RouteComponentProps, Link } from '@reach/router';
import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box } from 'grommet';
// import { NLSfB } from '../components/NLSfB';

import { useAuthentication } from '../contexts/authentication';

interface HomeParams {}
export const Home = observer((props: RouteComponentProps<HomeParams>) => {
  const { authentication, dbNames } = useAuthentication();
  return (
    <Box
      direction="row-responsive"
      justify="center"
      align="center"
      pad="xlarge"
      background="dark-2"
      gap="medium"
    >
      {authentication.ok
        ? [...dbNames].map(db => (
            <Link key={db} to={`/${db}`}>
              <Box>{db}</Box>
            </Link>
          ))
        : 'Please connect to server to see your databases'}
    </Box>
  );
});
