import { Box } from 'grommet';
import { Filter } from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Maybe } from '../../../utils/universe';

export const Snags: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  return (
    <>
      <Box direction="row" justify="between">
        <Box>{project.name}</Box>

        <Box direction="row" gap="medium">
          <Box>Aannemer x</Box>
          <Box>
            <Filter />
          </Box>
        </Box>
      </Box>
    </>
  );
});
