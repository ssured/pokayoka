// Based on https://github.com/rebassjs/rebass/blob/21104922ec9da621c9e98ab99ab90a779343f7c2/src/Dot.js
import { Box } from '../../base';
import styled from '@emotion/styled';

import {
  style,
  ratio,
  RatioProps,
  backgroundSize,
  BackgroundSizeProps,
  backgroundPosition,
  BackgroundPositionProps,
  border,
  BorderProps,
  borderColor,
  BorderColorProps,
  borderRadius,
  BorderRadiusProps,
  ResponsiveValue,
} from 'styled-system';
import { BackgroundImageProperty } from 'csstype';

interface BackgroundImageProps {
  image: ResponsiveValue<BackgroundImageProperty>;
}

const backgroundImage = style({
  prop: 'image',
  cssProperty: 'backgroundImage',
  transformValue: n => `url(${n})`,
});

export const RatioBox = styled<
  typeof Box,
  BackgroundImageProps &
    RatioProps &
    BackgroundSizeProps &
    BackgroundPositionProps &
    BorderProps &
    BorderColorProps &
    BorderRadiusProps
>(Box)(
  backgroundImage,
  ratio,
  backgroundSize,
  backgroundPosition,
  border,
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
