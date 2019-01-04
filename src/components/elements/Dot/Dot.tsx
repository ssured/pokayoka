// Based on https://github.com/rebassjs/rebass/blob/21104922ec9da621c9e98ab99ab90a779343f7c2/src/Dot.js

import styled from 'react-emotion';
import {
  space,
  color,
  borders,
  borderColor,
  borderRadius,
  size,
} from 'styled-system';

export const Dot = styled.button(
  {
    appearance: 'none',
    backgroundClip: 'padding-box',
  },
  size,
  borderRadius,
  borders,
  borderColor,
  space,
  color
);

Dot.defaultProps = {
  m: 0,
  p: 0,
  size: 16,
  bg: 'darken',
  borderRadius: 99999,
  border: 4,
  borderColor: 'transparent',
};
