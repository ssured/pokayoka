import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { RouteComponentProps } from '@reach/router';

import { Box, Heading } from 'grommet';

export const Overview: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => {
  // const project = useProjectAs(project => ({
  //   current: project,
  //   get capitalized() {
  //     return project.title.toUpperCase();
  //   },
  // }));

  return useObserver(() => (
    <Box>
      <Heading>Project</Heading>
      Overview
    </Box>
  ));
};
