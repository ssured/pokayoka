import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { action } from '@storybook/addon-actions';
import { TicTacToeCell } from './TicTacToeCell';

const stories = storiesOf('Components', module);

stories.add('Empty cell', () => (
  <TicTacToeCell position={{ x: 0, y: 0 }} onClick={action('onClick')} />
));

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
