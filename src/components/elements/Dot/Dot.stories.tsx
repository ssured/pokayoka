import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

import { Dot } from './Dot';

const stories = storiesOf('Elements', module);

stories.add('Dot', withInfo({ inline: true })(() => <Dot bg="black" />));
