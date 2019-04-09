import React from 'react';

import { Form, Heading, FormField, Box, Button } from 'grommet';
import { Project, PartialProject } from './model';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { updateSubject } from '../base';

export const ProjectFormEdit: React.FunctionComponent<{
  project: PartialProject;
}> = observer(({ project }) => {
  return (
    <Form
      onSubmit={e => updateSubject(project, e.value as Project)}
      value={project}
    >
      <Heading level="1" textAlign="center">
        Bewerk project
      </Heading>

      <Box direction="row" justify="center" gap="medium">
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
