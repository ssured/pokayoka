import { RouteComponentProps } from '@reach/router';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import {
  Box,
  Button,
  FormField,
  TextInput,
  TextInputProps,
  Grid,
  Heading,
  Select,
  TextArea,
  TextAreaProps,
} from 'grommet';
import { Save } from 'grommet-icons';
import { Formik, useField } from 'formik';
import {
  pBuildingStoreySchema,
  newPBuildingStorey,
} from '../../../../../../model/BuildingStorey/model';

const TextField: React.FunctionComponent<
  (TextInputProps | TextAreaProps) & {
    name: string;
    label: string;
    placeholder?: string;
    textarea?: boolean;
  }
> = ({ label, textarea, ...props }) => {
  const [field, meta] = useField(props.name);
  return (
    <>
      <FormField {...{ label, error: meta.touched ? meta.error : undefined }}>
        {textarea ? (
          <TextArea
            {...{ ...field, value: field.value || '' }}
            {...props as TextAreaProps}
          />
        ) : (
          <TextInput {...{ ...field, value: field.value || '' }} {...props} />
        )}
      </FormField>
    </>
  );
};

export const AddBuildingStorey: React.FunctionComponent<{
  initialValues?: PBuildingStorey;
  onSubmit: (buildingStorey: PBuildingStorey) => Promise<void>;
}> = observer(
  ({ initialValues = newPBuildingStorey({ name: '' }), onSubmit }) => {
    const [submitted, setSubmitted] = useState(false);

    return (
      <Formik
        initialValues={initialValues}
        validationSchema={pBuildingStoreySchema}
        validateOnBlur={submitted}
        validateOnChange={submitted}
        onSubmit={async (values, helpers) => {
          try {
            await onSubmit(values);
          } finally {
            helpers.setSubmitting(false);
          }
        }}
        render={({ handleSubmit, isSubmitting }) => (
          <form
            onSubmit={e => {
              e.preventDefault();
              setSubmitted(true);
              handleSubmit();
            }}
          >
            <Grid
              fill
              rows={['auto', 'auto']}
              columns={['auto', 'auto']}
              areas={[
                // { name: 'header', start: [0, 0], end: [1, 0] },
                { name: 'buttons', start: [0, 0], end: [1, 0] },
                { name: 'left', start: [0, 1], end: [0, 1] },
                { name: 'right', start: [1, 1], end: [1, 1] },
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
                <Heading level="3">Verdieping</Heading>

                <TextField label="Naam" name="name" />
                <TextField label="Omschrijving" name="description" textarea />
              </Box>

              <Box gridArea="right">
                <Heading level="3">Plattegrond</Heading>
              </Box>
            </Grid>
          </form>
        )}
      />
    );
  }
);
