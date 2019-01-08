import css from '@emotion/css';
import {
  greyDark,
  greyDarker,
  size3,
  size5,
  weightNormal,
  weightSemibold,
  sizes,
} from '../variables';
import styled from '@emotion/styled';

const titleColor = greyDarker;
const titleSize = size3;
const titleWeight = weightSemibold;
const titleLineHeight = `1.125`;
const titleStrongColor = `inherit`;
const titleStrongWeight = `inherit`;
const titleSubSize = `0.75em`;
const titleSupSize = `0.75em`;
const subtitleColor = greyDark;
const subtitleSize = size5;
const subtitleWeight = weightNormal;
const subtitleLineHeight = `1.25`;
const subtitleStrongColor = greyDarker;
const subtitleStrongWeight = weightSemibold;
const subtitleNegativeMargin = `-1.25rem`;

const shared = css`
  /* @extend %block; */
  word-break: break-word;
  em,
  span {
    font-weight: inherit;
  }
  sub {
    font-size: ${titleSubSize};
  }
  sup {
    font-size: ${titleSupSize};
  }
  .tag {
    vertical-align: middle;
  }
`;

const title = css`
  ${shared};
  color: ${titleColor};
  font-size: ${titleSize};
  font-weight: ${titleWeight};
  line-height: ${titleLineHeight};

  strong {
    color: ${titleStrongColor};
    font-weight: ${titleStrongWeight};
  }
  & + .highlight {
    margin-top: -0.75rem;
  }
  &:not(.is-spaced) + .subtitle {
    margin-top: ${subtitleNegativeMargin};
  }
`;

export const Title1 = styled<'h1'>('h1')`
  ${title};
  font-size: ${sizes[0]};
`;
export const Title2 = styled<'h1'>('h1')`
  ${title};
  font-size: ${sizes[1]};
`;
export const Title3 = styled<'h1'>('h1')`
  ${title};
  font-size: ${sizes[2]};
`;
export const Title4 = styled<'h1'>('h1')`
  ${title};
  font-size: ${sizes[3]};
`;
export const Title5 = styled<'h1'>('h1')`
  ${title};
  font-size: ${sizes[4]};
`;
export const Title6 = styled<'h1'>('h1')`
  ${title};
  font-size: ${sizes[5]};
`;

// .title {
//   color: ${titleColor};
//   font-size: ${titleSize};
//   font-weight: ${titleWeight};
//   line-height: ${titleLineHeight};
//   strong {
//     color: ${titleStrongColor};
//     font-weight: ${titleStrongWeight};
//   & + .highlight {
//     margin-top: -0.75rem;
//   &:not(.is-spaced) + .subtitle {
//     margin-top: ${subtitleNegativeMargin};
// }   // Sizes
//   @each $size in $sizes {
//     const i =  index($sizes, $size);
//     &.is-#{${i}} {
//       font-size: $size;
// }
// .subtitle {
//   color: ${subtitleColor};
//   font-size: ${subtitleSize};
//   font-weight: ${subtitleWeight};
//   line-height: ${subtitleLineHeight};
//   strong {
//     color: ${subtitleStrongColor};
//     font-weight: ${subtitleStrongWeight};
//   &:not(.is-spaced) + .title {
//     margin-top: ${subtitleNegativeMargin};
// }   // Sizes
//   @each $size in $sizes {
//     const i =  index($sizes, $size);
//     &.is-#{${i}} {
//       font-size: $size;
// }
