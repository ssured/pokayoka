import React from 'react';

export const Title: React.FunctionComponent<{ name?: string }> = ({
  name,
  children,
}) => <h1>{name || children}</h1>;
