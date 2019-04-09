import React from 'react';

import { Form, Heading, FormField, Box, Button } from 'grommet';
import { PartialProject } from './model';
import { observer } from 'mobx-react-lite';

export const ProjectFormEdit: React.FunctionComponent<{
  project: PartialProject;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement> & {
      value: {
        code: string;
        name: string;
      };
    }
  ) => any;
}> = observer(({ project, onSubmit }) => {
  return (
    <Form onSubmit={onSubmit} value={project}>
      <Heading level="1" textAlign="center">
        Bewerk project
      </Heading>

      <Box direction="row" justify="center" gap="medium">
        <FormField label="Projectcode" name="code" required />
        <FormField label="Projectnaam" name="name" required />
        {/* <FormField label="Plaats" name="city" required /> */}
      </Box>

      <Box direction="row" justify="evenly" margin={{ top: 'medium' }}>
        <Button label="Terug" />
        <Box />
        <Button type="submit" label="Opslaan" primary />
      </Box>
    </Form>
  );
});
