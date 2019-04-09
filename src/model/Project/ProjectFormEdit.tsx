import React, { ReactNode } from 'react';

import { Form, Heading, FormField, Box, Button } from 'grommet';
import { PartialProject, Project } from './model';
import { observer } from 'mobx-react-lite';
import { updateSubject } from '../base';
import { ImageInput } from '../../UI/binary-input';

export type FormValue = Pick<Project, 'code' | 'name' | '$image'>;

export const ProjectFormEdit: React.FunctionComponent<{
  heading?: ReactNode;
  project: PartialProject;
  onSubmit?: (value: FormValue) => void;
  onCancel?: () => void;
  afterSubmit?: () => void;
}> = observer(
  ({
    project,
    onCancel,
    afterSubmit,
    onSubmit = (value: FormValue) => {
      updateSubject(project, value);
      if (afterSubmit) afterSubmit();
    },
    heading = (
      <Heading level="1" textAlign="center">
        Bewerk project
      </Heading>
    ),
  }) => {
    return (
      <Form onSubmit={e => onSubmit(e.value)} value={project}>
        {heading}

        <Box direction="row" justify="center" gap="medium">
          <FormField label="Afbeelding" name="$image" component={ImageInput} />
          <FormField label="Projectcode" name="code" required />
          <FormField label="Projectnaam" name="name" required />
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
