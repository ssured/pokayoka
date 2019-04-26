import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading, Image, BoxProps } from 'grommet';
import { Maybe } from '../../utils/universe';
import { RoutedButton } from '../../layout/RoutedButton';
import { RouteMatch } from 'boring-router';

export const SheetTile: React.FunctionComponent<{
  box?: BoxProps;
  sheet: Maybe<PSheet>;
}> = observer(({ box = {}, sheet, children }) => (
  <Box
    pad="large"
    align="center"
    width="medium"
    height="medium"
    margin="medium"
    border
    round
    gap="small"
    {...box}
  >
    <Heading level="3">{sheet.name || 'no name'}</Heading>
    <Box height="small" width="small" border>
      <Image src={`/cdn/${sheet.$thumb}`} fit="cover" />
    </Box>
    {children}
  </Box>
));
