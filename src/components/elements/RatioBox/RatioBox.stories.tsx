import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

import { RatioBox } from './RatioBox';

const stories = storiesOf('Elements', module);

stories.add(
  'RatioBox',
  withInfo({ inline: true })(() => (
    <RatioBox
      ratio={9 / 16}
      image="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=2048&q=20"
      border="1px solid"
      borderBottom="5px solid"
      borderColor="red"
      p={2}
    />
  ))
);
