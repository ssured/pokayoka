import React, { ReactNode } from 'react';
import { Box, Heading } from 'grommet';

export const PageSection: React.FunctionComponent<{
  heading: string;
  action?: ReactNode;
}> = ({ heading, action }) => (
  <Box
    direction="row"
    justify="between"
    border="bottom"
    margin={{ bottom: 'medium' }}
  >
    <Heading level="3" margin={{ bottom: 'xsmall' }}>
      {heading}
    </Heading>
    {action && (
      <Box direction="row" align="end" margin={{ bottom: 'xsmall' }}>
        {action}
      </Box>
    )}
  </Box>
);
