import React from 'react';

export const Title: React.FunctionComponent<{ name: string }> = ({ name }) => (
  <h1>{name}</h1>
);
