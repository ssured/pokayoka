import React from 'react';
import { Button, ButtonProps } from 'grommet';

export const RoutedButton: React.FunctionComponent<
  ButtonProps & {}
> = props => {
  return <Button plain {...props} />;
};
