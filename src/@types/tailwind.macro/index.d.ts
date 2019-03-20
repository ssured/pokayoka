declare module 'tailwind.macro' {
  import * as CSS from 'csstype';

  export type CSSObject = CSS.Properties<string | number> &
    // Index type to allow selector nesting
    // This is "[key in string]" and not "[key: string]" to allow CSSObject to be self-referential
    {
      // we need the CSS.Properties in here too to ensure the index signature doesn't create impossible values
      [key in string]:
        | CSS.Properties<string | number>[keyof CSS.Properties<string | number>]
        | CSSObject
    };

  export default function tw(...args: any): CSSObject;
}
