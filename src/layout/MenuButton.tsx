import React from 'react';

import { Box, ButtonProps, Text } from 'grommet';
import { RoutedButton } from './RoutedButton';

export const MenuButton: React.FunctionComponent<ButtonProps & {}> = ({
  icon,
  label,
  ...props
}) => {
  return (
    <RoutedButton
      hoverIndicator="light-4"
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
