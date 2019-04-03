import React from 'react';
import { Formik, FormikActions, FormikProps, Field, FieldProps } from 'formik';
import { Form, FormField, Button, Heading, Box } from 'grommet';
import { Project } from './index';

interface FormValues extends Project {}

export const CreateForm: React.FunctionComponent<{
  onSubmit: (values: FormValues) => Promise<void>;
}> = ({ onSubmit }) => {
  return (
    <Box>
      <Heading level="2">Nieuw project</Heading>
      <Formik
        initialValues={{ name: '' }}
        onSubmit={async (
          values: FormValues,
          actions: FormikActions<FormValues>
        ) => {
          try {
            await onSubmit(values);
            actions.resetForm();
          } finally {
            actions.setSubmitting(false);
          }
        }}
        render={(formikBag: FormikProps<FormValues>) => (
          <Form
            onSubmit={formikBag.submitForm}
            onReset={() => formikBag.resetForm()}
          >
            <Field
              name="name"
              render={({ field, form }: FieldProps<FormValues>) => (
                <FormField
                  {...field}
                  label="Naam"
                  placeholder="Projectnaam"
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
                label="Maak nieuw project"
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
