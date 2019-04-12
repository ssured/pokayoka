import React from 'react';
import { Box, Grid } from 'grommet';

export const InPlaceEdit: React.FunctionComponent<{
  titles: [string, string?][];
}> = ({ titles, children }) => {
  const border: Border = {
    color: 'border',
    size: 'xsmall',
  };
  const pad = 'medium';

  return (
    <Grid
      fill
      rows={['auto', 'flex', 'auto']}
      columns={['flex', 'auto', 'flex']}
      areas={[
        { name: 'title', start: [1, 0], end: [1, 0] },
        { name: 'left-of-title', start: [0, 0], end: [0, 0] },
        { name: 'right-of-title', start: [2, 0], end: [2, 0] },
        { name: 'content', start: [0, 1], end: [2, 1] },
        { name: 'below-content', start: [0, 2], end: [2, 2] },
      ]}
    >
      <Box gridArea="title">
        <Tab border={border} titles={titles} />
      </Box>

      <Box
        gridArea="content"
        width="full"
        border={{ ...border, side: 'vertical' }}
        pad={pad}
        elevation={sizesSmallToBig[titles.length]}
        background="white"
      >
        {children}
      </Box>

      <Box gridArea="left-of-title" border={{ ...border, side: 'bottom' }} />
      <Box gridArea="right-of-title" border={{ ...border, side: 'bottom' }} />
      <Box gridArea="below-content" border={{ ...border, side: 'top' }} />
    </Grid>
  );
};
