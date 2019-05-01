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
  RangeInput,
  RangeInputProps,
  Text,
  SelectProps,
} from 'grommet';
import { Save, Add } from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import { default as React, useState } from 'react';
import { Page } from '../../../../components/Page/Page';
import { pRoleSchema } from '../../../../model/Role';
import { newPTask, pTaskSchema } from '../../../../model/Task';
import { useQuery, getSubject } from '../../../../contexts/spo-hub';
import { isSomething } from '../../../../utils/universe';
import { filter } from 'lodash';
import { fullName, isPPerson } from '../../../../model/Person';
import { Omit } from '../../../../utils/typescript';

const TextField: React.FunctionComponent<
  TextInputProps & {
    name: string;
    label: string;
    placeholder?: string;
    required?: boolean;
  }
> = ({ label, required, ...props }) => {
  const [field, meta] = useField(props.name);
  const requiredLabel = `${label}${required ? '*' : ''}`;
  return (
    <>
      <FormField
        {...{
          label: requiredLabel,
          error: meta.touched ? meta.error : undefined,
        }}
      >
        <TextInput {...{ ...field, value: field.value || '' }} {...props} />
      </FormField>
    </>
  );
};

const ProgressField: React.FunctionComponent<
  RangeInputProps & { name: string; label: string }
> = ({ label, ...props }) => {
  const [field, meta] = useField(props.name);
  return (
    <>
      <FormField {...{ label, error: meta.touched ? meta.error : undefined }}>
        <Box direction="row" align="center" pad="medium" gap="small">
          <Text>{field.value || 0}%</Text>
          <RangeInput
            min={0}
            max={100}
            step={100 / 4}
            {...{ ...field, value: field.value || 0 }}
            {...props}
          />
        </Box>
      </FormField>
    </>
  );
};

const PersonField: React.FunctionComponent<
  Omit<SelectProps, 'options' | 'onChange'> & {
    name: string;
    label: string;
    placeholder?: string;

    onChange: (selected: PPerson) => void;
  }
> = observer(({ label, onChange, ...props }) => {
  const [search, setSearch] = useState<RegExp | null>(null);
  const [field, meta] = useField(props.name);
  const results = useQuery(v => [
    {
      s: v('s'),
      p: '@type',
      o: 'PPerson',
    },
  ]);
  const persons = results
    .map(result => getSubject<PPerson>((result.variables as any).s))
    .filter(isSomething)
    .filter(isPPerson) as PPerson[];

  const options = persons
    .map(person => ({
      label: fullName(person),
      value: person,
    }))
    .filter(option => search == null || search.test(option.label));

  const currentResponsible = filter(field.value, a => a.sortIndex > 0)[0];

  const value =
    currentResponsible &&
    filter(options, o => currentResponsible.person === o.value)[0];

  return (
    <>
      <FormField
        {...{
          label,
          error: meta.touched ? meta.error : undefined,
        }}
      >
        <Box
          direction="row"
          align="center"
          pad="medium"
          gap="small"
          fill="horizontal"
        >
          <Select
            value={value}
            labelKey="label"
            valueKey="value"
            options={options}
            onChange={event => {
              onChange(event.value.value);
              field.onBlur(event);
            }}
            onSearch={text =>
              setSearch(text === '' ? null : new RegExp(text, 'i'))
            }
            {...props}
          />
          <Add />
        </Box>
      </FormField>
    </>
  );
});

export const New: React.FunctionComponent<{
  accountable: PPerson;
  initialValues?: PTask;
  onSubmit: (task: PTask) => Promise<void>;
}> = observer(
  ({
    accountable = {
      '@type': 'PPerson',
      identifier: 'sjoerd@weett.nl',
      familyName: 'Jong',
    } as PPerson,
    initialValues = newPTask({
      name: '',
      assigned: {
        [accountable.identifier]: {
          sortIndex: 0,
          progress: 0,
          person: accountable,
        },
      },
      basedOn: {},
    }),
    onSubmit,
  }) => {
    const [submitted, setSubmitted] = useState(false);

    return (
      <Page>
        <Formik
          initialValues={initialValues}
          validationSchema={pTaskSchema}
          validateOnBlur={submitted}
          validateOnChange={submitted}
          onSubmit={async (values, helpers) => {
            console.log(JSON.stringify(values, null, 2));
            debugger;
            try {
              await onSubmit(values);
            } finally {
              helpers.setSubmitting(false);
            }
          }}
          render={({
            handleSubmit,
            isSubmitting,
            errors,
            setFieldValue,
            values,
          }) => (
            <form
              onSubmit={e => {
                e.preventDefault();
                setSubmitted(true);
                handleSubmit();
              }}
            >
              <pre>Values {JSON.stringify(values, null, 2)}</pre>
              <pre>Errors {JSON.stringify(errors, null, 2)}</pre>
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

                <Box gridArea="search" />

                <Box gridArea="left">
                  <Heading level="3">Taak</Heading>

                  <TextField
                    label="Naam"
                    name="name"
                    placeholder="Taak naam"
                    required
                  />
                  <TextField
                    label="Op te leveren"
                    name="deliverable"
                    placeholder="Beschrijf kort het op te leveren resultaat"
                  />
                </Box>

                <Box gridArea="right">
                  <Heading level="3">Toewijzen</Heading>
                  <ProgressField
                    label={`Waargenomen voortgang`}
                    name={`assigned.${accountable.identifier}.progress`}
                  />

                  <PersonField
                    label="Verantwoordelijk"
                    name="assigned"
                    onChange={person => {
                      const assigned = {
                        [accountable.identifier]:
                          values.assigned[accountable.identifier],
                        [person.identifier]: {
                          sortIndex: 1,
                          progress: 0,
                          person,
                        },
                      };
                      setFieldValue('assigned', assigned);
                    }}
                  />
                </Box>
              </Grid>
            </form>
          )}
        />
      </Page>
    );
  }
);
