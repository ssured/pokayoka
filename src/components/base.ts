// from https://github.com/rebassjs/rebass/blob/89fc33f87e062e716092dc7bfbfcd4f300c014af/src/index.js
// moved from styled components to emotion

// import React from 'react';
import styled from '@emotion/styled';
import {
  space,
  color,
  width,
  height,
  flex,
  order,
  alignSelf,
  fontSize,
  fontFamily,
  fontWeight,
  textAlign,
  lineHeight,
  letterSpacing,
  borders,
  borderColor,
  borderRadius,
  buttonStyle,
  boxShadow,
  backgroundImage,
  backgroundSize,
  backgroundPosition,
  backgroundRepeat,
  opacity,
  variant,
} from 'styled-system';

import { Box, Flex } from '@rebass/grid/emotion';

export { Box, Flex };
// const css = props => props.css
// const themed = key => props => props.theme[key]

export const Text = styled(Box)(
  fontFamily,
  fontWeight,
  textAlign,
  lineHeight,
  letterSpacing
  //   themed('Text')
);

export const Heading = styled(Text)();
//   themed('Heading')

Heading.defaultProps = ({
  as: 'h2',
  m: 0,
  fontSize: 4,
  fontWeight: 'bold',
} as unknown) as any;

export const Link = styled(Box)();
//   themed('Link')

Link.defaultProps = ({
  as: 'a',
  color: 'blue',
} as unknown) as any;

export const Button = styled(Box)(
  {
    appearance: 'none',
    display: 'inline-block',
    textAlign: 'center',
    lineHeight: 'inherit',
    textDecoration: 'none',
  },
  fontWeight,
  borders,
  borderColor,
  borderRadius,
  buttonStyle
  //   themed('Button')
);

Button.defaultProps = ({
  as: 'button',
  fontSize: 'inherit',
  fontWeight: 'bold',
  m: 0,
  px: 3,
  py: 2,
  color: 'white',
  bg: 'blue',
  border: 0,
  borderRadius: 4,
} as unknown) as any;

export const Image = styled.img(
  {
    boxSizing: 'border-box',
    maxWidth: '100%',
    height: 'auto',
  },
  space,
  width,
  fontSize,
  color,
  flex,
  order,
  alignSelf,
  //   themed('Box'),
  //   css
  height,
  borderRadius
  //   themed('Image')
);

Image.defaultProps = ({
  as: 'img',
  m: 0,
} as unknown) as any;

const cards = variant({ key: 'cards' });

export const Card = styled(Box)(
  borders,
  borderColor,
  borderRadius,
  boxShadow,
  backgroundImage,
  backgroundSize,
  backgroundPosition,
  backgroundRepeat,
  opacity,
  //   themed('Card'),
  cards
);
