import css from '@emotion/css';
import {
  codeBackground,
  familyCode,
  familyPrimary,
  linkHover,
  preBackground,
  textStrong,
  weightBold,
  weightNormal,
  white,
  background,
} from '../variables';

const bodyBackgroundColor = white;
const bodySize = `16px`;
const bodyRendering = `optimizeLegibility`;
const bodyFamily = familyPrimary;
const bodyColor = `$text`;
const bodyWeight = weightNormal;
const bodyLineHeight = `1.5`;
const codeFamily = familyCode;
const codePadding = `0.25em 0.5em 0.25em`;
const codeWeight = `normal`;
const codeSize = `0.875em`;
const hrBackgroundColor = background;
const hrHeight = `2px`;
const hrMargin = `1.5rem 0`;
const strongColor = textStrong;
const strongWeight = weightBold;

export const generic = css`
  html & {
    background-color: ${bodyBackgroundColor};
    font-size: ${bodySize};
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    min-width: 300px;
    overflow-x: hidden;
    overflow-y: scroll;
    text-rendering: ${bodyRendering};
    text-size-adjust: 100%;
  }
  body & {
    color: ${bodyColor};
    font-size: 1rem;
    font-weight: ${bodyWeight};
    line-height: ${bodyLineHeight};
    font-family: ${bodyFamily};
  }

  article,
  aside,
  figure,
  footer,
  header,
  hgroup,
  section {
    display: block;
  }

  button,
  input,
  select,
  textarea {
    font-family: ${bodyFamily};
  }
  code,
  pre {
    -moz-osx-font-smoothing: auto;
    -webkit-font-smoothing: auto;
    font-family: ${codeFamily};
  }
  // Inline

  a {
    color: $link;
    cursor: pointer;
    text-decoration: none;
  }
  a strong {
    color: currentColor;
  }
  a:hover {
    color: ${linkHover};
  }
  code {
    background-color: ${codeBackground};
    color: $code;
    font-size: ${codeSize};
    font-weight: ${codeWeight};
    padding: ${codePadding};
  }
  hr {
    background-color: ${hrBackgroundColor};
    border: none;
    display: block;
    height: ${hrHeight};
    margin: ${hrMargin};
  }
  img {
    height: auto;
    max-width: 100%;
  }
  input[type='checkbox'],
  input[type='radio'] {
    vertical-align: baseline;
  }
  small {
    font-size: 0.875em;
  }
  span {
    font-style: inherit;
    font-weight: inherit;
  }
  strong {
    color: ${strongColor};
    font-weight: ${strongWeight};
  }
  /* // Block */

  fieldset {
    border: none;
  }
  pre {
    /* +overflow-touch; */
    background-color: ${preBackground};
    color: $pre;
    font-size: 0.875em;
    overflow-x: auto;
    padding: 1.25rem 1.5rem;
    white-space: pre;
    word-wrap: normal;
  }
  pre code {
    background-color: transparent;
    color: currentColor;
    font-size: 1em;
    padding: 0;
  }
  table td,
  table th {
    text-align: left;
    vertical-align: top;
  }
  table th {
    color: ${textStrong};
  }
`;
