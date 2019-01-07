import { RouteComponentProps, Link } from '@reach/router';
import * as React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Flex, Heading, Text } from 'rebass';
import { NLSfB } from '../components/NLSfB';

interface HomeParams {}
export const Home = observer((props: RouteComponentProps<HomeParams>) => (
  <Flex flexDirection="column">
    <Heading fontSize={[4, 5]}>Home</Heading>

    <Flex px={4} py={4}>
      <Box>Left</Box>
      <Box mx="auto" />
      <Box>Right</Box>
    </Flex>

    <Text>
      <Link to="/debug">Debug information</Link>
      <Link to="/guide">Guide editor</Link>
      <br />
      <Link to="/sjoerd">Sjoerd</Link> -
      <Link to="/sjoerd/project1">Project 1</Link> -
      <Link to="/sjoerd/project2">Project 2</Link> -
      <br />
      <Link to="/nlsfb">Nlsfb</Link> -
    </Text>

    <NLSfB />
  </Flex>
));
