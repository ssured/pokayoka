import React from 'react';

import { Form, Heading, FormField, Box, Button } from 'grommet';

export interface FormValue {
  code: string;
  name: string;
  sitename: string;
}

export const ProjectFormCreate: React.FunctionComponent<{
  onCreate: (value: FormValue) => any;
  initial?: Partial<FormValue>;
}> = ({ onCreate, initial = {} }) => {
  return (
    <Form onSubmit={e => onCreate(e.value)} value={initial}>
      <Heading level="1" textAlign="center">
        Maak nieuw project
      </Heading>

      <Box direction="row" justify="center" gap="medium">
        <FormField label="Projectcode" name="code" required />
        <FormField label="Projectnaam" name="name" required />
        <FormField label="Plaats" name="sitename" required />
      </Box>

      <Box direction="row" justify="evenly" margin={{ top: 'medium' }}>
        <Button label="Terug" />
        <Box />
        <Button type="submit" label="Volgende" primary />
      </Box>
    </Form>
  );
};
