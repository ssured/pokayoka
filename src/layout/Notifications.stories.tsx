import React from 'react';
import { storiesOf } from '@storybook/react';
import { Grommet, Box } from 'grommet';
import { InfoNotification } from './Notifications';

storiesOf('Notifications', module).add('info', () => (
  <Grommet full plain>
    <Box fill pad="medium">
      <InfoNotification message="some message" />
    </Box>
  </Grommet>
));
