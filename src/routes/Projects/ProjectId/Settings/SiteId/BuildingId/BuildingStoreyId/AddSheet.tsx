import { RouteComponentProps } from '@reach/router';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Page, PageTitle } from '../../components/Page/Page';
import {
  Box,
  Button,
  FormField,
  TextInput,
  TextInputProps,
  Grid,
  Heading,
} from 'grommet';
import { Save } from 'grommet-icons';
import { Formik, useField } from 'formik';
import { newSheet, sheetSchema } from '../../model/Sheet/model';
import { PDFInput } from '../../UI/binary-input';

const TextField: React.FunctionComponent<
  TextInputProps & { name: string; label: string; placeholder?: string }
> = ({ label, ...props }) => {
  const [field, meta] = useField(props.name);
  return (
    <>
      <FormField {...{ label, error: meta.touched ? meta.error : undefined }}>
        <TextInput {...{ ...field, value: field.value || '' }} {...props} />
      </FormField>
    </>
  );
};

export const AddSheet: React.FunctionComponent<
  RouteComponentProps<{}> & {
    initialValues?: Sheet;
    onSubmit: (sheet: Sheet) => Promise<void>;
  }
> = observer(
  ({
    initialValues = newSheet({ name: '', width: 0, height: 0, $thumb: '' }),
    onSubmit,
  }) => {
    const [submitted, setSubmitted] = useState(false);

    return (
      <PageTitle title="Plattegrond toevoegen" href={`./add-sheet`}>
        <Page>
          <Formik
            initialValues={initialValues}
            validationSchema={sheetSchema}
            validateOnBlur={submitted}
            validateOnChange={submitted}
            onSubmit={async (values, helpers) => {
              try {
                await onSubmit(values);
              } finally {
                helpers.setSubmitting(false);
              }
            }}
            render={({ handleSubmit, isSubmitting, setValues, resetForm }) => (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setSubmitted(true);
                  handleSubmit();
                }}
              >
                <Grid
                  fill
                  rows={['auto', 'auto', 'auto']}
                  columns={['auto', 'auto']}
                  areas={[
                    // { name: 'header', start: [0, 0], end: [1, 0] },
                    { name: 'buttons', start: [0, 0], end: [1, 0] },
                    { name: 'search', start: [0, 1], end: [0, 1] },
                    { name: 'left', start: [0, 2], end: [0, 2] },
                    { name: 'right', start: [1, 2], end: [1, 2] },
                  ]}
                  gap="medium"
                >
                  <Box
                    justify="end"
                    direction="row"
                    gap="medium"
                    gridArea="buttons"
                  >
                    <Button
                      label="Annuleren"
                      onClick={() => window.history.back()}
                      disabled={isSubmitting}
                    />
                    <Button
                      primary
                      type="submit"
                      icon={<Save />}
                      label="Opslaan"
                      disabled={isSubmitting}
                    />
                  </Box>

                  <Box gridArea="left">
                    <Heading level="3">Sheet</Heading>

                    <TextField label="Naam" name="name" />
                    <TextField label="Width" name="width" />
                    <TextField label="Height" name="height" />
                    <TextField label="$thumb" name="$thumb" />
                    <TextField label="$source" name="$source" />
                  </Box>

                  <Box gridArea="right">
                    <Heading level="3">Preview</Heading>
                    <PDFInput
                      onChange={sheet =>
                        sheet == null ? resetForm() : setValues(sheet)
                      }
                      value=""
                    />
                  </Box>
                </Grid>
              </form>
            )}
          />
        </Page>
      </PageTitle>
    );
  }
);
