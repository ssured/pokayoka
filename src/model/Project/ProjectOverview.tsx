import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading } from 'grommet';
import { ProjectModel } from './model';
import { SiteTile } from '../Site/SiteTile';
import { subj } from '../../utils/spo';
import { toJS } from 'mobx';
import { ProjectFormEdit } from './ProjectFormEdit';
import { useRoot } from '../../contexts/spo-hub';

export const ProjectOverview: React.FunctionComponent<{
  project: [ProjectModel, subj];
}> = observer(({ project: [project, subj] }) => {
  const partialProject = useRoot().projects[subj[subj.length - 1]];
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
            site => <div key={key}>Loading {site.name || ''}</div>
          )
        )}
      </Box>
      {partialProject && <ProjectFormEdit project={partialProject} />}
    </>
  );
});
