// Based on https://github.com/rebassjs/rebass/blob/21104922ec9da621c9e98ab99ab90a779343f7c2/src/Dot.js
import { Box } from '../../base';
import styled from '@emotion/styled';

import {
  ratio,
  style,
  backgroundSize,
  backgroundPosition,
  borders,
  borderColor,
  borderRadius,
} from 'styled-system';

const bgImage = style({
  prop: 'image',
  cssProperty: 'backgroundImage',
  transformValue: n => `url(${n})`,
});

export const RatioBox = styled(Box)(
  bgImage,
  ratio,
  backgroundSize,
  backgroundPosition,
  borders,
  borderColor,
  borderRadius
);

RatioBox.defaultProps = {
  ...Box.defaultProps,
  width: 1,
  ratio: 3 / 4,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};
