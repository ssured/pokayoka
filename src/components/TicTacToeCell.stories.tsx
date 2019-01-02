import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { action } from '@storybook/addon-actions';

import withPropsCombinations from 'react-storybook-addon-props-combinations';

import { TicTacToeCell } from './TicTacToeCell';

const stories = storiesOf('Components', module);

stories.add(
  'Cell types',
  withPropsCombinations(
    TicTacToeCell,
    {
      value: [' ', 'X', 'O'],
      position: [{ x: 0, y: 0 }],
      onClick: [action('onClick')],
    },
    { showSource: false }
  )
);

stories.add(
  'Full Info',
  withInfo({ inline: true })(() => (
    <TicTacToeCell
      value="X"
      position={{ x: 0, y: 0 }}
      onClick={action('onClick')}
    />
  ))
);
