import { RouteComponentProps } from '@reach/router';
import React from 'react';

import { observer } from 'mobx-react-lite';
import { Box, FormField, Button, Form, Heading } from 'grommet';

export const Tree: React.FunctionComponent<
  RouteComponentProps<{}> & {}
> = observer(({}) => {
  return (
    <Box justify="center">
      <Form
        onSubmit={({ value }) => {
          console.log(value);
        }}
        value={{ name: 'test' }}
      >
        <Heading level="1" textAlign="center">
          Maak nieuw project aan
        </Heading>

        <Box direction="row" justify="center" gap="medium">
          <FormField label="Project code" name="code" />
          <FormField label="Project naam" name="name" required />
          <FormField label="Plaats" name="city" required />
        </Box>

        <Box direction="row" justify="evenly" margin={{ top: 'medium' }}>
          <Button label="Terug" />
          <Box />
          <Button type="submit" label="Volgende" primary />
        </Box>
      </Form>
    </Box>
  );
});
