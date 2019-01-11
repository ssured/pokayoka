import { CSSObject } from 'tailwind.macro';

type TagType = keyof JSX.IntrinsicElements;
type JSXAs = { $as?: TagType };

export const jsx: <T extends TagType>(
  tag: T,
  css: CSSObject
) => React.FunctionComponent<JSX.IntrinsicElements[T] & JSXAs>;

export const div: (
  css: CSSObject
) => React.FunctionComponent<JSX.IntrinsicElements['div'] & JSXAs>;

export const nav: (
  css: CSSObject
) => React.FunctionComponent<JSX.IntrinsicElements['nav'] & JSXAs>;

export const span: (
  css: CSSObject
) => React.FunctionComponent<JSX.IntrinsicElements['span'] & JSXAs>;
