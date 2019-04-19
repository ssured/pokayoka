import React from 'react';
import { storiesOf } from '@storybook/react';
import { Grommet, Box, Button } from 'grommet';
import { InfoNotification } from './Notifications';
import { Home } from 'grommet-icons';

storiesOf('Notifications', module).add('info', () => (
  <Grommet full plain>
    <Box fill="horizontal" pad="medium">
      <InfoNotification message="some message" />
    </Box>
    <Box fill="horizontal" pad="medium">
      <InfoNotification
        message={
          <Box border pad="medium">
            messages can contain components
          </Box>
        }
      />
    </Box>
    <Box fill="horizontal" pad="medium">
      <InfoNotification
        message="default hide action can be overwritten"
        action={<Button icon={<Home />} label="Home" />}
      />
    </Box>
  </Grommet>
));
