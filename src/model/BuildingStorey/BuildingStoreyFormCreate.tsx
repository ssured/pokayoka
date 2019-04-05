import React from 'react';
import { Formik, FormikActions, FormikProps, Field, FieldProps } from 'formik';
import { Form, FormField, Button, Heading, Box } from 'grommet';
import { BuildingStorey } from './model';

interface BuildingStoreyFormCreateValues extends BuildingStorey {}

export const BuildingStoreyFormCreate: React.FunctionComponent<{
  onSubmit: (values: BuildingStoreyFormCreateValues) => Promise<void>;
}> = ({ onSubmit }) => {
  return (
    <Box>
      <Heading level="2">Nieuwe verdieping</Heading>
      <Formik
        initialValues={{ name: '' }}
        onSubmit={async (
          values: BuildingStoreyFormCreateValues,
          actions: FormikActions<BuildingStoreyFormCreateValues>
        ) => {
          try {
            await onSubmit(values);
            actions.resetForm();
          } finally {
            actions.setSubmitting(false);
          }
        }}
        render={(formikBag: FormikProps<BuildingStoreyFormCreateValues>) => (
          <Form
            onSubmit={formikBag.submitForm}
            onReset={() => formikBag.resetForm()}
          >
            <Field
              name="name"
              render={({
                field,
                form,
              }: FieldProps<BuildingStoreyFormCreateValues>) => (
                <FormField
                  {...field}
                  label="Naam"
                  placeholder="Verdieping naam"
                  error={form.touched.name && form.errors.name}
                />
              )}
            />
            <Box direction="row" justify="between" margin={{ top: 'medium' }}>
              <Button label="Terug" />
              <Button
                type="reset"
                label="Herstellen"
                disabled={!formikBag.dirty}
              />
              <Button
                type="submit"
                label="Maak nieuwe verdieping"
                primary
                disabled={!formikBag.isValid || formikBag.isSubmitting}
              />
            </Box>
          </Form>
        )}
      />
    </Box>
  );
};
