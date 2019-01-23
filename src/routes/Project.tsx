import { RouteComponentProps } from '@reach/router';
import * as React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Flex, Heading } from '../components/base';

interface ProjectParams {
  projectId: string;
}

// export const ModelContext = React.createContext<Project | null>(null);

export const Project = observer((props: RouteComponentProps<ProjectParams>) => (
  <Flex flexDirection="column">
    <Heading fontSize={[4, 5]}>Project</Heading>

    <Flex px={4} py={4}>
      {/*<ModelContext.Provider value={fetchDb(projectId)}>*/}
      <Box>Left</Box>
      <Box mx="auto" />
      <Box>Right</Box>

      {/*</ModelContext.Provider>*/}
    </Flex>
  </Flex>
));

// project = useContext<Project>(ModelContext)
