import React from 'react';
import { ButtonProps, Button } from 'grommet';

export const TextButton: React.FunctionComponent<ButtonProps> = ({
  children,
  ...props
}) => (
  <Button plain style={{ color: 'blue' }} {...props}>
    {children}
  </Button>
);
