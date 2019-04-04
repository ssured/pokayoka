import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading } from 'grommet';
import { RouteButton } from '../../../components/ui/RouteLink';
import { BuildingStoreyModel } from './model';
import { subj } from '../../../utils/spo';

export const BuildingStoreyTile: React.FunctionComponent<{
  buildingStorey: [BuildingStoreyModel, subj];
}> = observer(({ buildingStorey: [buildingStorey, subj] }) => (
  <Box
    pad="large"
    align="center"
    width="medium"
    height="medium"
    margin="medium"
    border
    round
    gap="small"
  >
    <Heading level="3">{buildingStorey.name || 'no name'}</Heading>
    <RouteButton
      href={`/buildingStoreys/${subj.join('.')}`}
      label={'Open buildingStorey'}
    />
  </Box>
));
