import { RouteComponentProps } from '@reach/router';
import * as React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Flex, Heading } from 'rebass';

interface DebugParams {}

export const Debug = observer((props: RouteComponentProps<DebugParams>) => (
  <Flex flexDirection="column">
    <Heading fontSize={[4, 5]}>Debug</Heading>

    <Flex px={4} py={4}>
      <Box>Left</Box>
      <Box mx="auto" />
      <Box>Right</Box>
    </Flex>
  </Flex>
));
