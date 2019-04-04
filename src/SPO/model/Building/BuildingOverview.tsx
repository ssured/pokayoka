import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading } from 'grommet';
import { BuildingModel } from './model';
import { BuildingTile } from './BuildingTile';
import { subj } from '../../../utils/spo';

export const BuildingOverview: React.FunctionComponent<{
  building: [BuildingModel, subj];
}> = observer(({ building: [building, subj] }) => {
  return (
    <>
      <Heading level="3">{building.name}</Heading>
      <Box
        direction="row-responsive"
        justify="center"
        align="center"
        pad="medium"
        gap="medium"
      >
        TOT HIER {subj.join('.')}
        {/* {[...building.buildings.entries()].map(([key, building]) =>
          building.fold(
            building => (
              <BuildingTile
                key={key}
                building={[building, [...subj, 'buildings', key]]}
              />
            ),
            building => <div>Loading building {building.name || ''}</div>
          )
        )} */}
      </Box>
    </>
  );
});
