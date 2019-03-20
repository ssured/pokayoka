import React from 'react';

import {
  Formik,
  Field as FormikField,
  Form as FormikForm,
  FormikActions,
} from 'formik';

import { Title } from '../../elements/Title';
import styled from '@emotion/styled';
import tw from 'tailwind.macro';
import { Button } from '../elements/index';

const Form = styled(FormikForm)`
  ${tw`m-3 p-3`};
  background: #eee;
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-gap: 2em;
`;

const Label = styled('label')`
  grid-column: 1/2;
`;

const Field = styled(FormikField)`
  ${tw`border`}
  grid-column: 2/3;
`;

export interface LoginFormValues {
  username: string;
  password: string;
}

const initialValues: LoginFormValues = {
  username: '',
  password: '',
};

export const Login: React.SFC<{
  onSubmit: (values: LoginFormValues) => Promise<void>;
}> = ({ onSubmit }) => (
  <div>
    <Title>Inloggen</Title>
    <Formik
      initialValues={initialValues}
      onSubmit={(
        values: LoginFormValues,
        { setSubmitting }: FormikActions<LoginFormValues>
      ) => onSubmit(values).finally(() => setSubmitting(false))}
      render={({ handleSubmit, handleChange }) => (
        <Form>
          <Label htmlFor="username">Gebruikersnaam</Label>
          <Field name="username" type="text" />

          <Label htmlFor="password">Wachtwoord</Label>
          <Field name="password" type="text" />

          <Button type="submit">Submit</Button>
        </Form>
      )}
    />
  </div>
);
