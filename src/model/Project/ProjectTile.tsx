import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading, Image } from 'grommet';
import { RouteButton } from '../../components/ui/RouteLink';
import { ProjectModel } from './model';
import { subj } from '../../utils/spo';
import { Image as ImageIcon } from 'grommet-icons';

export const ProjectTile: React.FunctionComponent<{
  project: [ProjectModel, subj];
}> = observer(({ project: [project, subj] }) => (
  <Box
    pad="large"
    align="center"
    width="medium"
    height="medium"
    margin="medium"
    border
    round
    gap="small"
  >
    {project.$image ? (
      <Box height="small" width="small" border>
        <Image src={`/cdn/${project.$image}`} fit="cover" />
      </Box>
    ) : (
      <Box height="small" width="small" align="center" justify="center">
        <ImageIcon size="xlarge" />
      </Box>
    )}
    <Heading level="3">{project.name || 'no name'}</Heading>
    <RouteButton href={`/projects/${subj.join('.')}`} label={'Open project'} />
  </Box>
));
