declare module 'react-sparkline' {
  import React from 'react';

  const Sparkline: React.FunctionComponent<{
    data: { date: string; value: number }[];
    width?: number;
    height?: number;
  }>;

  export default Sparkline;
}
