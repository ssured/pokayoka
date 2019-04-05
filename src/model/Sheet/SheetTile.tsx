import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading, Image } from 'grommet';
import { RouteButton } from '../../components/ui/RouteLink';
import { SheetModel } from './model';
import { subj } from '../../utils/spo';

export const SheetTile: React.FunctionComponent<{
  sheet: [SheetModel, subj];
}> = observer(({ sheet: [sheet, subj] }) => (
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
    <Heading level="3">{sheet.name || 'no name'}</Heading>
    <Box height="small" width="small" border>
      <Image src={`/cdn/${sheet.$thumb}`} fit="cover" />
    </Box>
    <RouteButton href={`/sheets/${subj.join('.')}`} label={'Open sheet'} />
  </Box>
));
