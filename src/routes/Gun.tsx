import React, { useState } from 'react';
import Gun from 'gun';
import { createUniverse } from '../utils/universe';
import { observer } from 'mobx-react-lite';
import {
  Heading,
  Box,
  FormField,
  Button,
  TextInput,
  TextInputProps,
  Grid,
} from 'grommet';
import { Formik, useField } from 'formik';
import { Save } from 'grommet-icons';
import charwise from 'charwise';

const gun = Gun<{ [key: string]: any }>('http://localhost:8080/gun');

const universe = createUniverse<{ [key: string]: User }>({
  resolve: (path, setValue) => {
    const key = charwise.encode(path);
    return {
      onActive: () => {
        console.log(`activate ${key}`);
        gun.get(key).on(({ _, ...data }) => {
          console.log(`Set ${key} to ${JSON.stringify(data)}`);
          setValue(data);
        }, true);
      },
      onInactive: () => {
        console.log(`deactivate ${key}`);
        gun.get(key).off();
      },
    };
  },
  updateListener: (path, value) => {
    console.log(`update ${path.join(',')} to ${JSON.stringify(value)}`);
    const key = charwise.encode(path);
    // @ts-ignore
    gun.get(key).put(value);
  },
  pathToKey: charwise.encode,
});

// @ts-ignore
window.gun = gun;
// @ts-ignore
window.universe = universe;

const user = universe['sjoerd@weett.nl']();

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

export const GunComponent: React.FunctionComponent<{}> = observer(({}) => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Box>
      <Heading>YO</Heading>
      <ul>
        {/* <li>id: {m(user.identifier)}</li> */}
        {/* <li>name: {m(user.name)}</li> */}

        {/* <li>keys: {Object.keys(user).join(',')}</li> */}

        {Object.entries(user).map(([key, value]) => (
          <li key={key}>
            {key} = {value}
          </li>
        ))}
      </ul>

      <Formik
        initialValues={user}
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
                <TextField label="Naam" name="name" />
              </Box>
            </Grid>
          </form>
        )}
      />
    </Box>
  );
});
