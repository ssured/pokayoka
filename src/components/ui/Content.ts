import { textStrong, weightSemibold, background, border } from './variables';
import { block } from './mixins';
import styled from '@emotion/styled';

// https://github.com/jgthms/bulma/blob/67d2ef779b8058df15a92459401c0848b8883e44/sass/elements/content.sass

const contentHeadingColor = textStrong;
const contentHeadingWeight = weightSemibold;
const contentHeadingLineHeight = 1.125;

const contentBlockquoteBackgroundColor = background;
const contentBlockquoteBorderLeft = `5px solid ${border}`;
const contentBlockquotePadding = `1.25em 1.5em`;

const contentPrePadding = `1.25em 1.5em`;

const contentTableCellBorder = `1px solid ${border}`;
const contentTableCellBorderWidth = `0 0 1px`;
const contentTableCellPadding = `0.5em 0.75em`;
const contentTableCellHeadingColor = textStrong;
const contentTableHeadCellBorderWidth = `0 0 2px`;
const contentTableHeadCellColor = textStrong;
const contentTableFootCellBorderWidth = `2px 0 0`;
const contentTableFootCellColor = textStrong;

export const Content = styled('div')`
.content
  @extend %block
  // Inline
  li + li
    margin-top: 0.25em
  // Block
  p,
  dl,
  ol,
  ul,
  blockquote,
  pre,
  table
    &:not(:last-child)
      margin-bottom: 1em
  h1,
  h2,
  h3,
  h4,
  h5,
  h6
    color: $content-heading-color
    font-weight: $content-heading-weight
    line-height: $content-heading-line-height
  h1
    font-size: 2em
    margin-bottom: 0.5em
    &:not(:first-child)
      margin-top: 1em
  h2
    font-size: 1.75em
    margin-bottom: 0.5714em
    &:not(:first-child)
      margin-top: 1.1428em
  h3
    font-size: 1.5em
    margin-bottom: 0.6666em
    &:not(:first-child)
      margin-top: 1.3333em
  h4
    font-size: 1.25em
    margin-bottom: 0.8em
  h5
    font-size: 1.125em
    margin-bottom: 0.8888em
  h6
    font-size: 1em
    margin-bottom: 1em
  blockquote
    background-color: $content-blockquote-background-color
    border-left: $content-blockquote-border-left
    padding: $content-blockquote-padding
  ol
    list-style-position: outside
    margin-left: 2em
    margin-top: 1em
    &:not([type])
      list-style-type: decimal
      &.is-lower-alpha
        list-style-type: lower-alpha
      &.is-lower-roman
        list-style-type: lower-roman
      &.is-upper-alpha
        list-style-type: upper-alpha
      &.is-upper-roman
        list-style-type: upper-roman
  ul
    list-style: disc outside
    margin-left: 2em
    margin-top: 1em
    ul
      list-style-type: circle
      margin-top: 0.5em
      ul
        list-style-type: square
  dd
    margin-left: 2em
  figure
    margin-left: 2em
    margin-right: 2em
    text-align: center
    &:not(:first-child)
      margin-top: 2em
    &:not(:last-child)
      margin-bottom: 2em
    img
      display: inline-block
    figcaption
      font-style: italic
  pre
    +overflow-touch
    overflow-x: auto
    padding: $content-pre-padding
    white-space: pre
    word-wrap: normal
  sup,
  sub
    font-size: 75%
  table
    width: 100%
    td,
    th
      border: $content-table-cell-border
      border-width: $content-table-cell-border-width
      padding: $content-table-cell-padding
      vertical-align: top
    th
      color: $content-table-cell-heading-color
      text-align: left
    thead
      td,
      th
        border-width: $content-table-head-cell-border-width
        color: $content-table-head-cell-color
    tfoot
      td,
      th
        border-width: $content-table-foot-cell-border-width
        color: $content-table-foot-cell-color
    tbody
      tr
        &:last-child
          td,
          th
            border-bottom-width: 0
  // Sizes
  &.is-small
    font-size: $size-small
  &.is-medium
    font-size: $size-medium
  &.is-large
    font-size: $size-large`;
