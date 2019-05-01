import { Formik } from 'formik';
import { Box, Button, Grid, Heading } from 'grommet';
import { Save } from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { useRoot } from '../contexts/spo-hub';
import { TextField } from '../form/TextField';
import { PageTitle } from '../layout/PageTitle';
import { isUser, newUser } from '../model/User';
import { newPPerson } from '../model/Person';

export const User: React.FunctionComponent<{}> = observer(({}) => {
  const [submitted, setSubmitted] = useState(false);
  const user = useRoot()();

  return (
    <Box>
      <PageTitle>Account</PageTitle>
      <ul>
        {/* <li>id: {m(user.identifier)}</li> */}
        {/* <li>name: {m(user.name)}</li> */}

        {/* <li>keys: {Object.keys(user).join(',')}</li> */}

        <li>isUser: {isUser(user) ? 'YEA' : 'Nope'}</li>
      </ul>

      {
        <Formik
          initialValues={
            isUser(user)
              ? user
              : newUser({
                  is: newPPerson({ familyName: '' }),
                  ...(user as any),
                })
          }
          // validationSchema={userSchema}
          validateOnBlur={submitted}
          validateOnChange={submitted}
          onSubmit={async (values, helpers) => {
            try {
              Object.assign(user, values);
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
                  <Heading level="3">Personalia</Heading>

                  <TextField label="Type" name="@type" />
                  <TextField label="ID" name="identifier" />
                  <TextField label="Voornaam" name="is.givenName" />
                  <TextField label="Tussenvoegsel" name="is.additionalName" />
                  <TextField label="Achternaam" name="is.familyName" />
                  <TextField label="Email" name="is.email" />
                </Box>
              </Grid>
            </form>
          )}
        />
      }
    </Box>
  );
});
