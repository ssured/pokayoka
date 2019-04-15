import { RouteComponentProps } from '@reach/router';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Page, PageTitle } from '../../components/Page/Page';
import {
  Box,
  Button,
  FormField,
  TextInput,
  FormFieldProps,
  TextInputProps,
  Grid,
  Heading,
  Select,
} from 'grommet';
import { Save } from 'grommet-icons';
import {
  Formik,
  FormikActions,
  FormikProps,
  Form,
  Field,
  FieldProps,
} from 'formik';
import useFormal from '@kevinwolf/formal-web';
import * as yup from 'yup';

const schema = yup.object().shape({
  givenName: yup.string(),
  additionalName: yup.string(),
  familyName: yup.string().required(),
  email: yup.string().email(),
  telephone: yup.string(),
  description: yup.string(),
  role: yup.string().required(),
});

const initialValues: Person = {
  givenName: 'Tony',
  familyName: 'Stark',
  email: 'ironman@avengers.io',
};

const Field: React.FunctionComponent<
  TextInputProps & { label: string; error?: string }
> = ({ label, error, placeholder, ...props }) => {
  return (
    <FormField {...{ label, error }}>
      <TextInput {...props} />
    </FormField>
  );
};
export const AddContactPerson: React.FunctionComponent<
  RouteComponentProps<{}> & {}
> = observer(({}) => {
  const formal = useFormal(initialValues, {
    schema,
    onSubmit: values => console.log('Your values are:', values),
  });

  return (
    <PageTitle title="Contactpersoon toevoegen" href={`./add-contact`}>
      <Page>
        <Formik
          initialValues={{ firstName: '' }}
          onSubmit={(
            values: MyFormValues,
            actions: FormikActions<MyFormValues>
          ) => {
            console.log({ values, actions });
            alert(JSON.stringify(values, null, 2));
            actions.setSubmitting(false);
          }}
          render={(formikBag: FormikProps<MyFormValues>) => <Form />}
        />
        <form {...formal.getFormProps()}>
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
            <Box justify="end" direction="row" gap="medium" gridArea="buttons">
              <Button label="Annuleren" onClick={() => window.history.back()} />
              <Button
                {...formal.getSubmitButtonProps()}
                primary
                icon={<Save />}
                label="Opslaan"
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

              <Field label="Voornaam" {...formal.getFieldProps('givenName')} />

              <FormField
                label="Tussenvoegsel"
                htmlFor="additionalName"
                error={formal.errors.additionalName}
              >
                <TextInput
                  id="additionalName"
                  placeholder=""
                  {...formal.getFieldProps('additionalName')}
                />
              </FormField>

              <FormField
                label="Achternaam"
                htmlFor="familyName"
                error={formal.errors.familyName}
              >
                <TextInput
                  id="familyName"
                  placeholder=""
                  {...formal.getFieldProps('familyName')}
                />
              </FormField>

              <FormField
                label="Email"
                htmlFor="email"
                error={formal.errors.email}
              >
                <TextInput
                  id="email"
                  placeholder=""
                  {...formal.getFieldProps('email')}
                />
              </FormField>
            </Box>

            <Box gridArea="right">
              <Heading level="3">Rol</Heading>
              <FormField label="Rol" htmlFor="role" error={formal.errors.role}>
                <TextInput
                  id="role"
                  placeholder=""
                  {...formal.getFieldProps('role')}
                />
              </FormField>
            </Box>
          </Grid>
        </form>
      </Page>
    </PageTitle>
  );
});
