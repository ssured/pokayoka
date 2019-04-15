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
  Select,
} from 'grommet';
import { Save } from 'grommet-icons';
import { Formik, FormikProps, useField } from 'formik';
import * as yup from 'yup';
import { newRole, roleSchema } from '../../model/Role';

const validationSchema = yup.object<Role>().shape({
  roleName: yup.string().required(),
  member: yup.object().shape({
    givenName: yup.string(),
    additionalName: yup.string(),
    familyName: yup.string().required(),
    email: yup.string().email(),
    telephone: yup.string(),
    description: yup.string(),
    // role: yup.string().required(),
  }),
});

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

export const AddContactPerson: React.FunctionComponent<
  RouteComponentProps<{}> & {
    initialValues?: Role;
  }
> = observer(({ initialValues = newRole({ roleName: '' }) }) => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <PageTitle title="Contactpersoon toevoegen" href={`./add-contact`}>
      <Page>
        <Formik
          initialValues={initialValues}
          validationSchema={roleSchema}
          validateOnBlur={submitted}
          validateOnChange={submitted}
          onSubmit={(values, helpers) => {
            console.log({ values, actions: helpers });
            alert(JSON.stringify(values, null, 2));
            helpers.setSubmitting(false);
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

                <Box gridArea="search">
                  <Select
                    placeholder="Zoek persoon op naam"
                    options={[]}
                    onSearch={() => {}}
                  />
                </Box>

                <Box gridArea="left">
                  <Heading level="3">Personalia</Heading>

                  <TextField label="Voornaam" name="member.givenName" />
                  <TextField
                    label="Tussenvoegsel"
                    name="member.additionalName"
                  />
                  <TextField label="Achternaam" name="member.familyName" />
                  <TextField label="Email" name="member.email" />
                </Box>

                <Box gridArea="right">
                  <Heading level="3">Rol</Heading>
                  <TextField label="Rol" name="roleName" />
                </Box>
              </Grid>
            </form>
          )}
        />
      </Page>
    </PageTitle>
  );
});
