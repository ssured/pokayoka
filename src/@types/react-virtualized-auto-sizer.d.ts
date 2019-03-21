declare module 'react-virtualized-auto-sizer' {
  import React from 'react';

  const AutoSizer: React.FunctionComponent<{
    children: React.FunctionComponent<{ width: number; height: number }>;
  }>;

  export default AutoSizer;
}
