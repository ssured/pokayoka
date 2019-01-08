// https://github.com/jgthms/bulma/blob/67d2ef779b8058df15a92459401c0848b8883e44/sass/components/card.sass
import { Box, Flex } from '../base';
import styled from '@emotion/styled';
import { rgba } from 'polished';

import {
  white,
  black,
  text,
  textStrong,
  weightBold,
  border,
} from '../variables';

const cardColor = text;
const cardBackgroundColor = white;
const cardShadow = `0 2px 3px ${rgba(black, 0.1)}, 0 0 0 1px ${rgba(
  black,
  0.1
)}`;

const cardHeaderBackgroundColor = 'transparent';
const cardHeaderColor = textStrong;
const cardHeaderShadow = `0 1px 2px ${rgba(black, 0.1)}`;
const cardHeaderWeight = weightBold;

const cardContentBackgroundColor = 'transparent';

const cardFooterBackgroundColor = 'transparent';
const cardFooterBorderTop = `1px solid ${border}`;

export const BaseCard = styled(Box)({
  maxWidth: '100%',
  position: 'relative',
});

BaseCard.defaultProps = {
  ...Box.defaultProps,
  bg: cardBackgroundColor,
  boxShadow: cardShadow,
  color: cardColor,
};

export const CardHeader = styled(Flex)();

CardHeader.defaultProps = {
  ...Flex.defaultProps,
  bg: cardHeaderBackgroundColor,
  alignItems: 'stretch',
  boxShadow: cardHeaderShadow,
};

export const CardHeaderTitle = styled(Flex)({
  fontWeight: cardHeaderWeight,
});

CardHeaderTitle.defaultProps = {
  ...Flex.defaultProps,
  alignItems: 'center',
  color: cardHeaderColor,
  flex: '1 1 auto',
  p: 1, // padding: 0.75rem
  // &.is-centered
  //   justify-content: center
};

export const CardHeaderIcon = styled(Flex)({
  cursor: 'pointer',
});
CardHeaderTitle.defaultProps = {
  ...Flex.defaultProps,
  alignItems: 'center',
  justifyContent: 'center',
  p: 1,
};

export const CardImage = styled('img')({
  display: 'block',
  position: 'relative',
});

export const CardContent = styled(Box)();

CardContent.defaultProps = {
  ...Box.defaultProps,
  bg: cardContentBackgroundColor,
  p: 2,
};

export const CardFooter = styled(Flex)({
  borderTop: cardFooterBorderTop,
});

CardFooter.defaultProps = {
  ...Flex.defaultProps,
  bg: cardFooterBackgroundColor,
  alignItems: 'stretch',
};

export const CardFooterItem = styled(Flex)({
  '&:not(:last-child)': {
    borderRight: cardFooterBorderTop,
  },
});

CardFooterItem.defaultProps = {
  ...Flex.defaultProps,
  alignItems: 'center',
  flex: '1 0 0',
  justifyContent: 'center',
  p: 1,
};

export const Card: typeof BaseCard & {
  Header: typeof CardHeader;
  HeaderTitle: typeof CardHeaderTitle;
  HeaderIcon: typeof CardHeaderIcon;
  Image: typeof CardImage;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
  FooterItem: typeof CardFooterItem;
} = BaseCard as any;

Card.Header = CardHeader;
Card.HeaderTitle = CardHeaderTitle;
Card.HeaderIcon = CardHeaderIcon;
Card.Image = CardImage;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.FooterItem = CardFooterItem;
