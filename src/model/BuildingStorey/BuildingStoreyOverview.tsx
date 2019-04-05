import React from 'react';
import { observer } from 'mobx-react-lite';

import { Box, Heading } from 'grommet';
import { BuildingStoreyModel } from './model';
import { subj } from '../../utils/spo';
import { SheetFormCreate } from '../Sheet/SheetFormCreate';
import { SheetTile } from '../Sheet/SheetTile';

export const BuildingStoreyOverview: React.FunctionComponent<{
  buildingStorey: [BuildingStoreyModel, subj];
}> = observer(({ buildingStorey: [buildingStorey, subj] }) => {
  return (
    <>
      <Heading level="3">{buildingStorey.name}</Heading>
      <Box
        direction="row-responsive"
        justify="center"
        align="center"
        pad="medium"
        gap="medium"
      >
        {[...buildingStorey.sheets.entries()].map(([key, sheet]) =>
          sheet.fold(
            sheet => (
              <SheetTile key={key} sheet={[sheet, [...subj, 'sheets', key]]} />
            ),
            sheet => <div key={key}>Loading sheet {sheet.name || ''}</div>
          )
        )}
      </Box>
      <SheetFormCreate
        onSubmit={async data => {
          buildingStorey.addSheet(data);
        }}
      />
    </>
  );
});
