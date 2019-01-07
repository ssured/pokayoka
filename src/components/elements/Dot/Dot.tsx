// Based on https://github.com/rebassjs/rebass/blob/21104922ec9da621c9e98ab99ab90a779343f7c2/src/Dot.js

import styled from '@emotion/styled';
import {
  space,
  SpaceProps,
  color,
  ColorProps,
  borders,
  BorderProps,
  borderColor,
  BorderColorProps,
  borderRadius,
  BorderRadiusProps,
  size,
  SizeProps,
} from 'styled-system';

const componentName = 'button';

export const Dot = styled<
  typeof componentName,
  SpaceProps &
    ColorProps &
    BorderProps &
    BorderColorProps &
    BorderRadiusProps &
    SizeProps
>(componentName)`
  ${space};
  ${color};
  ${borders};
  ${borderColor};
  ${borderRadius};
  ${size};

  appearance: none;
  background-clip: padding-box;
`;

Dot.defaultProps = {
  m: 0,
  p: 0,
  size: 16,
  bg: 'darken',
  borderRadius: 99999,
  border: 4,
  borderColor: 'transparent',
};
