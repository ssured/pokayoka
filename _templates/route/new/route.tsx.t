---
to: src/routes/<%= Name %>.tsx
unless_exists: true
---
import { RouteComponentProps } from '@reach/router';
import * as React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Flex, Heading } from '../components/base';

interface <%= Name %>Params {}

export const <%= Name %> = observer((props: RouteComponentProps<<%= Name %>Params>) => (
  <Flex flexDirection="column">
    <Heading fontSize={[4, 5]}><%= Name %></Heading>

    <Flex px={4} py={4}>
      <Box>Left</Box>
      <Box mx="auto" />
      <Box>Right</Box>
    </Flex>
  </Flex>
));
