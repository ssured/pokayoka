import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading } from 'grommet';
import { RouteButton } from '../../../components/ui/RouteLink';
import { BuildingModel } from './model';
import { subj } from '../../../utils/spo';

export const BuildingTile: React.FunctionComponent<{
  building: [BuildingModel, subj];
}> = observer(({ building: [building, subj] }) => (
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
    <Heading level="3">{building.name || 'no name'}</Heading>
    <RouteButton
      href={`/buildings/${subj.join('.')}`}
      label={'Open building'}
    />
  </Box>
));
