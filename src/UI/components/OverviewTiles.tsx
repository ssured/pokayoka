import React from 'react';
import { Button, Text, Grid, Box } from 'grommet';
import styled from 'styled-components';
import { RouteLink } from '../../components/ui/RouteLink';
import { navigate } from '@reach/router';

const UnstyledOverviewTiles: React.FunctionComponent<{
  className?: string;
}> = ({ className = '', children }) => (
  <Grid className={className}>
    <div className="container">{children}</div>
  </Grid>
);

export const OverviewTiles = styled(UnstyledOverviewTiles)`
  grid-template-columns: 1fr 200px 200px 1fr;
  grid-template-areas:
    'margelinks tile tile margerechts'
    'margelinks tile tile margerechts';
  grid-template-rows: 250px 250px;
  align-items: center;
  justify-content: center;

  .container {
    display: flex;
  }
`;

const UnstyledOverviewTile: React.FunctionComponent<{
  className?: string;
  icon: React.ElementType;
  label: string;
  href: string;
}> = ({ className = '', icon, label, href }) => {
  const Icon = icon;
  return (
    <Box
      className={className}
      // onClick={e => {
      //   e.preventDefault();
      //   navigate(href);
      // }}
    >
      <Box className="icon">
        <Icon size="large" />
      </Box>
      <Box className="label">
        <Text>label</Text>
      </Box>
    </Box>
  );
};

export const OverviewTile = styled(UnstyledOverviewTile)`
  cursor: pointer;
  grid-area: tile;
`;
