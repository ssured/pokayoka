import React from 'react';
import { Formik, FormikActions, FormikProps, Field, FieldProps } from 'formik';
import { Form, FormField, Button, Heading, Box } from 'grommet';
import { Project } from './model';
import { ImageInput } from '../../../UI/binary-input';
import { Omit } from '../../../utils/typescript';
import { toHex } from '../../../utils/buffer';

interface ProjectFormCreateValues extends Omit<Project, 'sites'> {}

export const ProjectFormCreate: React.FunctionComponent<{
  onSubmit: (values: ProjectFormCreateValues) => Promise<void>;
}> = ({ onSubmit }) => {
  return (
    <Box>
      <Heading level="2">Nieuw project</Heading>
      <Formik
        initialValues={{ name: '' }}
        onSubmit={async (
          values: ProjectFormCreateValues,
          actions: FormikActions<ProjectFormCreateValues>
        ) => {
          try {
            await onSubmit(values);
            actions.resetForm();
          } finally {
            actions.setSubmitting(false);
          }
        }}
        render={(formikBag: FormikProps<ProjectFormCreateValues>) => (
          <Form
            onSubmit={formikBag.submitForm}
            onReset={() => formikBag.resetForm()}
          >
            <Field
              name="name"
              render={({
                field,
                form,
              }: FieldProps<ProjectFormCreateValues>) => (
                <FormField
                  {...field}
                  label="Naam"
                  placeholder="Projectnaam"
                  error={form.touched.name && form.errors.name}
                />
              )}
            />
            <Field
              name="$image"
              render={({
                field,
                form,
              }: FieldProps<ProjectFormCreateValues>) => (
                <FormField
                  {...field}
                  onChange={async blobOrNull => {
                    if (blobOrNull) {
                      form.setFieldValue(field.name, null);
                      const blob = (blobOrNull as unknown) as Blob;
                      const response = new Response(blob);
                      const arrayBuffer = await response.clone().arrayBuffer();

                      const hash = toHex(
                        await window.crypto.subtle.digest(
                          'SHA-256',
                          arrayBuffer
                        )
                      );

                      const cdnCache = await window.caches.open('cdn');
                      await cdnCache.put(`/cdn/${hash}`, response);

                      form.setFieldValue(field.name, hash);
                    } else {
                      form.setFieldValue(field.name, null);
                    }
                  }}
                  label="Afbeelding"
                  component={ImageInput}
                  pad
                  error={form.touched.$image && form.errors.$image}
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
