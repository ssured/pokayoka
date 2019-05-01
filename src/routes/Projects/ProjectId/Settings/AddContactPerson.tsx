import { Formik, useField } from 'formik';
import {
  Box,
  Button,
  FormField,
  Grid,
  Heading,
  Select,
  TextInput,
  TextInputProps,
  Text,
} from 'grommet';
import { Save } from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { newPRole, pRoleSchema } from '../../../../model/Role';
import { newPPerson } from '../../../../model/Person';
import { useQuery } from '../../../../contexts/spo-hub';
import { groupBy } from 'lodash';

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

const RoleField: React.FunctionComponent<
  TextInputProps & { name: string; label: string; placeholder?: string }
> = observer(({ label, ...props }) => {
  const [field, meta] = useField(props.name);
  const results = useQuery(v => [
    { s: v('s'), p: '@type', o: 'PRole' },
    { s: v('s'), p: 'roleName', o: v('roleName') },
  ]);
  return (
    <>
      <FormField {...{ label, error: meta.touched ? meta.error : undefined }}>
        <TextInput
          {...{ ...field, value: field.value || '' }}
          suggestions={Object.entries(
            groupBy(results.map(r => r.variables), 'roleName')
          )
            .sort(([, resA], [, resB]) => resB.length - resA.length)
            .map(([roleName, results]) => roleName)}
          onSelect={event => {
            (event.target as any).value = event.suggestion;
            field.onChange(event);
          }}
          {...props}
        />
      </FormField>
    </>
  );
});

export const AddContactPerson: React.FunctionComponent<{
  initialValues?: PRole;
  onSubmit: (role: PRole) => Promise<void>;
}> = observer(
  ({
    initialValues = newPRole({
      roleName: '',
      member: newPPerson({ familyName: '' }),
    }),
    onSubmit,
  }) => {
    const [submitted, setSubmitted] = useState(false);

    return (
      <Formik
        initialValues={initialValues}
        validationSchema={pRoleSchema}
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
                <TextField label="Tussenvoegsel" name="member.additionalName" />
                <TextField label="Achternaam" name="member.familyName" />
                <TextField label="Email" name="member.email" />
              </Box>

              <Box gridArea="right">
                <Heading level="3">Rol</Heading>
                <RoleField label="Rol" name="roleName" />
              </Box>
            </Grid>
          </form>
        )}
      />
    );
  }
);
