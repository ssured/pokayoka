import styled from '@emotion/styled';

import {
  space,
  SpaceProps,
  color,
  ColorProps,
  width,
  WidthProps,
  fontSize,
  FontSizeProps,
  flexWrap,
  FlexWrapProps,
  flexDirection,
  FlexDirectionProps,
  alignItems,
  AlignItemsProps,
  justifyContent,
  JustifyContentProps,
  flex,
  FlexProps,
  order,
  OrderProps,
  alignSelf,
  AlignSelfProps,
  boxShadow,
  BoxShadowProps,
} from 'styled-system';

export const Box = styled<
  'div',
  SpaceProps &
    ColorProps &
    WidthProps &
    FontSizeProps &
    FlexProps &
    OrderProps &
    AlignSelfProps &
    BoxShadowProps
>('div')(
  {
    boxSizing: 'border-box',
  },
  space,
  color,
  width,
  fontSize,
  flex,
  order,
  alignSelf,
  boxShadow
);
Box.displayName = 'Box';

export const Flex = styled<
  typeof Box,
  FlexWrapProps & FlexDirectionProps & AlignItemsProps & JustifyContentProps
>(Box)(
  {
    display: 'flex',
  },
  flexWrap,
  flexDirection,
  alignItems,
  justifyContent
);

Flex.displayName = 'Flex';
