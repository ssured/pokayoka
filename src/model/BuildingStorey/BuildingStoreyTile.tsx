import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading, BoxProps, Image } from 'grommet';
import { Maybe } from '../../utils/universe';

export const BuildingStoreyTile: React.FunctionComponent<{
  box?: BoxProps;
  buildingStorey: Maybe<PBuildingStorey>;
}> = observer(({ box = {}, buildingStorey, children }) => (
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
    {buildingStorey.activeSheet && buildingStorey.activeSheet.$thumb && (
      <Image src={`/cdn/${buildingStorey.activeSheet.$thumb}`} fit="contain" />
    )}
    <Heading level="3">{buildingStorey.name}</Heading>
    {children}
  </Box>
));
