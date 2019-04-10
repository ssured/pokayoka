import React, { ReactNode } from 'react';

import { Form, Heading, FormField, Box, Button } from 'grommet';
import { PartialBuildingStorey, BuildingStorey } from './model';
import { observer } from 'mobx-react-lite';
import { updateSubject } from '../base';

export type FormValue = Pick<BuildingStorey, 'name'>;

export const BuildingStoreyFormEdit: React.FunctionComponent<{
  heading?: ReactNode;
  buildingStorey: PartialBuildingStorey;
  onSubmit?: (value: FormValue) => void;
  onCancel?: () => void;
  afterSubmit?: () => void;
}> = observer(
  ({
    buildingStorey,
    onCancel,
    afterSubmit,
    onSubmit = (value: FormValue) => {
      updateSubject(buildingStorey, value);
      if (afterSubmit) afterSubmit();
    },
    heading = (
      <Heading level="1" textAlign="center">
        Bewerk verdieping
      </Heading>
    ),
  }) => {
    return (
      <Form onSubmit={e => onSubmit(e.value)} value={buildingStorey}>
        {heading}

        <Box direction="row" justify="center" gap="medium">
          <FormField label="Verdieping naam" name="name" required />
        </Box>

        <Box direction="row" justify="evenly" margin={{ top: 'medium' }}>
          <Button label="Terug" onClick={onCancel} />
          <Box />
          <Button type="submit" label="Opslaan" primary />
        </Box>
      </Form>
    );
  }
);
