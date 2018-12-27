import { RouteComponentProps } from '@reach/router';
import * as React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Flex, Heading } from '../components/base';

interface UserParams {
  userId: string;
  children?: JSX.Element;
}

export const User = observer((props: RouteComponentProps<UserParams>) => (
  <Flex flexDirection="column">
    <Heading fontSize={[4, 5]}>User {props.userId}</Heading>

    <Flex px={4} py={4}>
      <Box>Left</Box>
      <Box mx="auto" />
      <Box>Right</Box>
    </Flex>

    {props.children}
  </Flex>
));
