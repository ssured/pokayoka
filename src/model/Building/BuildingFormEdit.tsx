import React, { ReactNode } from 'react';

import { Form, Heading, FormField, Box, Button } from 'grommet';
import { PartialBuilding, Building } from './model';
import { observer } from 'mobx-react-lite';
import { updateSubject } from '../base';
import { ImageInput } from '../../UI/binary-input';

export type FormValue = Pick<Building, 'name' | '$image'>;

export const BuildingFormEdit: React.FunctionComponent<{
  heading?: ReactNode;
  building: PartialBuilding;
  onSubmit?: (value: FormValue) => void;
  onCancel?: () => void;
  afterSubmit?: () => void;
}> = observer(
  ({
    building,
    onCancel,
    afterSubmit,
    onSubmit = (value: FormValue) => {
      updateSubject(building, value);
      if (afterSubmit) afterSubmit();
    },
    heading = (
      <Heading level="1" textAlign="center">
        Bewerk gebouw
      </Heading>
    ),
  }) => {
    return (
      <Form onSubmit={e => onSubmit(e.value)} value={building}>
        {heading}

        <Box direction="row" justify="center" gap="medium">
          <FormField label="Afbeelding" name="$image" component={ImageInput} />
          <FormField label="Gebouw naam" name="name" required />
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
