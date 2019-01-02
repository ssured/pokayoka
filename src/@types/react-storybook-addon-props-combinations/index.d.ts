declare module 'react-storybook-addon-props-combinations' {
  import React from 'react';
  import { RenderFunction } from '@storybook/react';

  export default function withPropsCombinations<
    P extends { [key: string]: any }
  >(
    Component: React.ReactType<P>,
    propCombinations: { [K in keyof P]: P[K][] },
    options?: Partial<{
      showSource: boolean;
    }>
  ): RenderFunction;
}
