import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading } from 'grommet';
import { ProjectModel } from './model';
import { SiteTile } from '../Site/SiteTile';
import { subj } from '../../../utils/spo';

export const ProjectOverview: React.FunctionComponent<{
  project: [ProjectModel, subj];
}> = observer(({ project: [project, subj] }) => {
  return (
    <>
      <Heading level="3">
        {project.name} {project.sites.size}
      </Heading>
      <Box
        direction="row-responsive"
        justify="center"
        align="center"
        pad="medium"
        gap="medium"
      >
        {[...project.sites.entries()].map(([key, site]) =>
          site.fold(
            site => (
              <SiteTile key={key} site={[site, [...subj, 'sites', key]]} />
            ),
            site => <div>Loading {site.name || ''}</div>
          )
        )}
      </Box>
    </>
  );
});
