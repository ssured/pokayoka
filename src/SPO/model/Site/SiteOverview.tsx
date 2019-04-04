import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading } from 'grommet';
import { SiteModel } from './model';
import { BuildingTile } from '../Building/BuildingTile';
import { subj } from '../../../utils/spo';

export const SiteOverview: React.FunctionComponent<{
  site: [SiteModel, subj];
}> = observer(({ site: [site, subj] }) => {
  return (
    <>
      <Heading level="3">
        {site.name} {site.buildings.size}
      </Heading>
      <Box
        direction="row-responsive"
        justify="center"
        align="center"
        pad="medium"
        gap="medium"
      >
        {[...site.buildings.entries()].map(([key, building]) =>
          building.fold(
            building => (
              <BuildingTile
                key={key}
                building={[building, [...subj, 'buildings', key]]}
              />
            ),
            building => <div>Loading building {building.name || ''}</div>
          )
        )}
      </Box>
    </>
  );
});
