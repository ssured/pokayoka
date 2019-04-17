import React from 'react';

import { Box, ButtonProps, Text } from 'grommet';
import { RoutedButton } from './RoutedButton';
import { RouteMatch } from 'boring-router';

export const MenuButton: React.FunctionComponent<
  ButtonProps & {
    route: RouteMatch<any, any, any>;
    label: string;
  }
> = ({ icon, label, route, ...props }) => {
  return (
    <RoutedButton
      hoverIndicator="light-4"
      to={route}
      {...props}
      label={
        <Box pad="small" gap="xsmall" justify="start" direction="row">
          {icon}
          <Text>{label}</Text>
        </Box>
      }
    />
  );
};
