import React, { useContext } from 'react';
import { GridProps, ResponsiveContext, Grid } from 'grommet';

export const TileGrid: React.FunctionComponent<
  GridProps & {
    tileSize?: 'small' | 'medium';
  }
> = ({ tileSize = 'medium', ...gridProps }) => {
  const size = useContext(ResponsiveContext);

  return (
    <Grid
      align="start"
      columns={size === 'small' ? undefined : { count: 'fill', size: tileSize }}
      rows={size === 'small' ? undefined : tileSize}
      gap="medium"
      {...gridProps}
    />
  );
};
