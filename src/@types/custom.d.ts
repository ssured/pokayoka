// typings/custom.d.ts
declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

declare module '@rebass/grid/emotion' {
  // Type definitions for @rebass/grid 6.0
  // Project: https://github.com/rebassjs/grid
  // Definitions by: Anton Vasin <https://github.com/antonvasin>
  //                 Victor Orlov <https://github.com/vittorio>
  //                 Louis Hache <https://github.com/lhache>
  //                 Adam Lavin <https://github.com/lavoaster>
  // Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
  // TypeScript Version: 2.9

  export type Omit<T, K extends keyof T> = Pick<
    T,
    ({ [P in keyof T]: P } &
      { [P in K]: never } & { [x: string]: never; [x: number]: never })[keyof T]
  >;

  import { ComponentType } from 'react';
  import { Interpolation } from '@emotion/core';
  import { StyledComponent } from '@emotion/styled';

  export type ResponsiveProp = number | string | Array<string | number>;

  export interface CommonProps {
    width?: ResponsiveProp;
    fontSize?: ResponsiveProp;
    color?: ResponsiveProp;
    bg?: ResponsiveProp;
    m?: ResponsiveProp;
    mt?: ResponsiveProp;
    mr?: ResponsiveProp;
    mb?: ResponsiveProp;
    ml?: ResponsiveProp;
    mx?: ResponsiveProp;
    my?: ResponsiveProp;
    p?: ResponsiveProp;
    pt?: ResponsiveProp;
    pr?: ResponsiveProp;
    pb?: ResponsiveProp;
    pl?: ResponsiveProp;
    px?: ResponsiveProp;
    py?: ResponsiveProp;
    theme?: any;
    // this is actually more powerful than the plugin because of some limitations of the transform
    /**
     * This works even without babel-plugin-styled-components.
     */
    css?: Interpolation<any>;
  }

  export interface BoxProps
    extends Omit<React.ComponentPropsWithRef<'div'>, 'color' | 'is' | 'css'>,
      CommonProps {
    flex?: ResponsiveProp;
    order?: ResponsiveProp;
    is?: string | ComponentType<any>;
    alignSelf?: ResponsiveProp;
  }

  export interface FlexProps extends BoxProps {
    alignItems?: ResponsiveProp;
    justifyContent?: ResponsiveProp;
    flexDirection?: ResponsiveProp;
    flexWrap?: ResponsiveProp;
  }

  export type BoxComponent<Theme extends object> = StyledComponent<
    Partial<BoxProps>,
    any,
    Theme
  >;

  export type FlexComponent<Theme extends object> = StyledComponent<
    Partial<FlexProps>,
    any,
    Theme
  >;

  export interface Theme {
    breakpoints: string[];
    space?: number[];
    fontSizes?: number[];
  }

  export const Box: BoxComponent<Theme>;
  export const Flex: FlexComponent<Theme>;
  export const theme: Theme;
  export const div: ComponentType<React.HTMLProps<HTMLDivElement>>;
}
