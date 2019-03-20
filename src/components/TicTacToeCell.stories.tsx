import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { action } from '@storybook/addon-actions';

import withPropsCombinations from 'react-storybook-addon-props-combinations';

import { TicTacToeCell } from './TicTacToeCell';

import { css, InterpolationWithTheme, SerializedStyles } from '@emotion/core';
import styled from '@emotion/styled';
import tw from 'tailwind.macro';

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

const green = tw`text-green`;

const Button = styled<'button', { css?: SerializedStyles; blue?: boolean }>(
  'button'
)`
  font-weight: bold;
  ${tw`font-mono text-sm text-red`};
  ${p => p.blue && tw`hover:text-blue`};
  ${p => p.css};
`;

// className={green}

const Button2 = styled.button`
  ${tw`font-mono`};
`;

const App = () => (
  <React.Fragment>
    <Button blue>hello, world</Button>
    <Button css={css(green, tw`uppercase`)}>hello, world</Button>
    <div style={{ ...green, ...tw`uppercase` }}>hello, world</div>
  </React.Fragment>
);
stories.add('TailWind', () => <App />);
