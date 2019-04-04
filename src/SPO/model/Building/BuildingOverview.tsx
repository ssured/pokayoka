import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading } from 'grommet';
import { BuildingModel } from './model';
import { subj } from '../../../utils/spo';
import { BuildingStoreyTile } from '../BuildingStorey/BuildingStoreyTile';

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
        {[...building.buildingStoreys.entries()].map(([key, buildingStorey]) =>
          buildingStorey.fold(
            buildingStorey => (
              <BuildingStoreyTile
                key={key}
                buildingStorey={[
                  buildingStorey,
                  [...subj, 'buildingStoreys', key],
                ]}
              />
            ),
            buildingStorey => (
              <div>Loading buildingStorey {buildingStorey.name || ''}</div>
            )
          )
        )}
      </Box>
    </>
  );
});
