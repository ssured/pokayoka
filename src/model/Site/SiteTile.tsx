import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading } from 'grommet';
import { RouteButton } from '../../components/ui/RouteLink';
import { SiteModel } from './model';
import { subj } from '../../utils/spo';

export const SiteTile: React.FunctionComponent<{
  site: [SiteModel, subj];
}> = observer(({ site: [site, subj] }) => (
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
    <Heading level="3">{site.name || 'no name'}</Heading>
    <RouteButton href={`/sites/${subj.join('.')}`} label={'Open site'} />
  </Box>
));
