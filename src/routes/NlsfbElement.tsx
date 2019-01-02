import { RouteComponentProps } from '@reach/router';
import * as React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Flex, Heading } from '../components/base';

interface NlsfbElementParams {
  elementId:string;
}

export const NlsfbElement = observer((props: RouteComponentProps<NlsfbElementParams>) => (
  <Flex flexDirection="column">
    <Heading fontSize={[4, 5]}>NlsfbElement:{props.elementId}</Heading>
    <Flex px={4} py={4}>
      <Box>Left</Box>
      <Box mx="auto" />
      <Box>Right</Box>
    </Flex>
  </Flex>
));
