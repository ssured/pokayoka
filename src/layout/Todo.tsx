import React from 'react';
import { BoxProps, Box, Stack } from 'grommet';
import { observer } from 'mobx-react-lite';

export const Todo: React.FunctionComponent<{}> = observer(({ children }) => (
  <Stack guidingChild="first" interactiveChild="first">
    {children}
    <Box fill background="rgba(255,0,255,0.1)" />
  </Stack>
));
