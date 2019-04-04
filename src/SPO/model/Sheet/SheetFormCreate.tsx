import React from 'react';
import { Formik, FormikActions, FormikProps, Field, FieldProps } from 'formik';
import { Form, FormField, Button, Heading, Box } from 'grommet';
import { Sheet } from './model';
import { PDFInput, PDFData } from '../../../UI/binary-input';
import { Omit } from '../../../utils/typescript';
import { toHex } from '../../../utils/buffer';

interface SheetFormCreateValues extends Sheet {}

export const SheetFormCreate: React.FunctionComponent<{
  onSubmit: (values: SheetFormCreateValues) => Promise<void>;
}> = ({ onSubmit }) => {
  return (
    <Box>
      <Heading level="2">Nieuwe plattegrond toevoegen</Heading>
      <Formik
        initialValues={{
          name: '',
          width: 0,
          height: 0,
          $thumb: '',
          images: {},
        }}
        onSubmit={async (
          values: SheetFormCreateValues,
          actions: FormikActions<SheetFormCreateValues>
        ) => {
          try {
            await onSubmit(values);
            actions.resetForm();
          } finally {
            actions.setSubmitting(false);
          }
        }}
        render={(formikBag: FormikProps<SheetFormCreateValues>) => (
          <Form
            onSubmit={formikBag.submitForm}
            onReset={() => formikBag.resetForm()}
          >
            <Field
              name="name"
              render={({ field, form }: FieldProps<SheetFormCreateValues>) => (
                <FormField
                  {...field}
                  label="Naam"
                  placeholder="Plattegrond naam"
                  error={form.touched.name && form.errors.name}
                />
              )}
            />
            <Field
              name="$thumb"
              render={({ field, form }: FieldProps<SheetFormCreateValues>) => (
                <FormField
                  {...field}
                  onChange={async dataOrNull => {
                    if (dataOrNull) {
                      const sheet = (dataOrNull as unknown) as PDFData;
                      form.setValues(sheet);
                    } else {
                      form.setFieldValue(field.name, null);
                    }
                  }}
                  label="PDF"
                  component={PDFInput}
                  pad
                  error={form.touched.$thumb && form.errors.$thumb}
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
                label="Voeg nieuwe plattegrond toe"
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
