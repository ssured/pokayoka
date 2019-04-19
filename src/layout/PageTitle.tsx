import React from 'react';
import { Heading } from 'grommet';

/**
 * Default page title
 */

export const PageTitle: React.FunctionComponent<{}> = ({ children }) => {
  return <Heading>{children}</Heading>;
};
