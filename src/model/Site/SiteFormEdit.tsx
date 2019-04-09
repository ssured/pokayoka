import React, { ReactNode } from 'react';

import { Form, Heading, FormField, Box, Button } from 'grommet';
import { PartialSite, Site } from './model';
import { observer } from 'mobx-react-lite';
import { updateSubject } from '../base';

export type FormValue = Pick<Site, 'name'>;

export const SiteFormEdit: React.FunctionComponent<{
  heading?: ReactNode;
  site: PartialSite;
  onSubmit?: (value: FormValue) => void;
  onCancel?: () => void;
  afterSubmit?: () => void;
}> = observer(({ site, onCancel, afterSubmit, onSubmit = (value: FormValue) => {
    updateSubject(site, value);
    if (afterSubmit) afterSubmit();
  }, heading = <Heading level="1" textAlign="center">
      Bewerk locatie
    </Heading> }) => {
  return (
    <Form onSubmit={e => onSubmit(e.value)} value={site}>
      {heading}

      <Box direction="row" justify="center" gap="medium">
        <FormField label="Locatie naam" name="name" required />
      </Box>

      <Box direction="row" justify="evenly" margin={{ top: 'medium' }}>
        <Button label="Terug" onClick={onCancel} />
        <Box />
        <Button type="submit" label="Opslaan" primary />
      </Box>
    </Form>
  );
});
