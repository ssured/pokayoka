import { RouteComponentProps } from '@reach/router';
import * as React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Flex, Heading } from '../components/base';

interface NlsfbParams {
  children?: JSX.Element;
}

export const Nlsfb = observer((props: RouteComponentProps<NlsfbParams>) => (
  <Flex flexDirection="column">
    <Heading fontSize={[4, 5]}>Nlsfb</Heading>
    
    {props.children}
  </Flex>
));
