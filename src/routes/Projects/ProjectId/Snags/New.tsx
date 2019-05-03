import { FieldState, FormState } from 'formstate';
import {
  Box,
  Button,
  FormField,
  Grid,
  Heading,
  RangeInput,
  RangeInputProps,
  Select,
  SelectProps,
  Text,
  TextArea,
  TextAreaProps,
  TextInput,
  TextInputProps,
  Image,
} from 'grommet';
import { Add, Save } from 'grommet-icons';
import { observer, useObserver } from 'mobx-react-lite';
import { default as React, useMemo, useState, FunctionComponent } from 'react';
import { Page } from '../../../../components/Page/Page';
import { getSubject, useQuery } from '../../../../contexts/spo-hub';
import { fullName, isPPerson } from '../../../../model/Person';
import { newPTask } from '../../../../model/Task';
import { Omit } from '../../../../utils/typescript';
import { isSomething, getPath } from '../../../../utils/universe';
import { getSubj, subj } from '../../../../utils/spo';
import { isEqual } from '../../../../utils/index';
import { ImageInput } from '../../../../UI/binary-input';
import { action } from 'mobx';
import { newPObservation } from '../../../../model/Observation';

function showRequired(label: string, required?: boolean) {
  return `${label}${required ? ' *' : ''}`;
}

const TextField: React.FunctionComponent<
  TextInputProps & {
    label: string;
    placeholder?: string;
    required?: boolean;
    fieldState: FieldState<string>;
  }
> = observer(({ label, required, fieldState, ...props }) => (
  <FormField
    {...{
      label: showRequired(label, required),
      error: fieldState.error,
    }}
  >
    <TextInput
      value={fieldState.value as any}
      onChange={
        ((e: any) => {
          fieldState.onChange(e.target.value);
        }) as any
      }
      {...props as any}
    />
  </FormField>
));

const TextAreaField: React.FunctionComponent<
  TextAreaProps & {
    label: string;
    placeholder?: string;
    required?: boolean;
    fieldState: FieldState<string>;
  }
> = observer(({ label, required, fieldState, ...props }) => (
  <FormField
    {...{
      label: showRequired(label, required),
      error: fieldState.error,
    }}
  >
    <TextArea
      value={fieldState.value as any}
      onChange={
        ((e: any) => {
          fieldState.onChange(e.target.value);
        }) as any
      }
      {...props as any}
    />
  </FormField>
));

type RangeFieldProps = RangeInputProps & {
  label: string;
  required?: boolean;
  fieldState: FieldState<number>;
};

const RangeField: React.FunctionComponent<RangeFieldProps> = observer(
  ({ label, required, fieldState, ...props }) => (
    <FormField
      {...{
        label: showRequired(label, required),
        error: fieldState.error,
      }}
    >
      <Box direction="row" align="center" pad="medium" gap="small">
        <Text>{fieldState.value || 0}%</Text>
        <RangeInput
          value={fieldState.value}
          onChange={(e: any) => {
            fieldState.onChange(parseInt(e.target.value, 10));
          }}
          {...props}
        />
      </Box>
    </FormField>
  )
);

const ProgressField: React.FunctionComponent<RangeFieldProps> = ({
  min = 0,
  max = 100,
  step = 25,
  ...props
}) => <RangeField min={min} max={max} step={step} {...props} />;

type SelectOption<T> = {
  label: string;
  value: T;
};

type SelectFieldProps<T> = Omit<SelectProps, 'options' | 'onChange'> & {
  label: string;
  placeholder?: string;

  options: SelectOption<T>[];

  fieldState: FieldState<T>;
};

function SelectField<T>(
  {
    label,
    options,
    fieldState,
    ...props
  }: SelectFieldProps<T> /*& { children?: ReactNode }*/
) {
  return useObserver(() => (
    <FormField label={label} error={fieldState.error}>
      <Box
        direction="row"
        align="center"
        pad="medium"
        gap="small"
        fill="horizontal"
      >
        <Select
          value={
            options.find(option => isEqual(option.value, fieldState.value)) ||
            ''
          }
          labelKey="label"
          valueKey="value"
          options={options}
          onChange={event => fieldState.onChange(event.value.value)}
          {...props}
        />
        <Add />
      </Box>
    </FormField>
  ));
}

const SelectPersonField = observer(
  ({
    label,
    fieldState,
    ...props
  }: Omit<SelectFieldProps<subj>, 'options'> & {
    label: string;
    placeholder?: string;
  }) => {
    const [search, setSearch] = useState<RegExp | null>(null);
    const results = useQuery(v => [
      {
        s: v('s'),
        p: '@type',
        o: 'PPerson',
        // filter: tuple => true
      },
    ]);
    const persons = results
      .map(result => getSubject<PPerson>((result.variables as any).s))
      .filter(isSomething)
      .filter(isPPerson) as PPerson[];

    const options = persons
      .map(person => ({
        label: fullName(person),
        value: getPath(person)!,
      }))
      .filter(option => search == null || search.test(option.label));

    return (
      <SelectField
        label={label}
        options={[{ label: 'niemand', value: [] }, ...options]}
        fieldState={fieldState}
        onSearch={text => setSearch(text === '' ? null : new RegExp(text, 'i'))}
        {...props}
      />
    );
  }
);

const PhotoField: FunctionComponent<{
  label: string;
  placeholder?: string;
  required?: boolean;
  fieldState: FieldState<string>;
}> = observer(({ label, required, fieldState, ...props }) => (
  <FormField
    {...{
      label: showRequired(label, required),
      error: fieldState.error,
    }}
  >
    <ImageInput
      onChange={({ value }) => fieldState.onChange(value || '')}
      value={fieldState.value}
    />
  </FormField>
));

/** Our validations */
const requiredWithMessage = (message: string) => (val: string) =>
  !val.trim() && message;

export const New: React.FunctionComponent<{
  accountable: PPerson;
  location: PObservationLocation;
  onSubmit: (task: PTask) => Promise<void>;
}> = observer(({ accountable, location, onSubmit }) => {
  const form = useMemo(
    () =>
      new FormState({
        name: new FieldState('').validators(
          requiredWithMessage('Naam kan niet leeg gelaten worden')
        ),
        deliverable: new FieldState('').validators(),
        progress: new FieldState(0).validators(),

        responsibleSubj: new FieldState<subj>([]),

        $images: new FormState<FieldState<string>[]>([new FieldState('')]),
      }).validators(),
    []
  );

  return (
    <Page>
      <form
        onSubmit={async e => {
          e.preventDefault();
          const result = await form.validate();
          if (!result.hasError) {
            const responsible =
              result.value.responsibleSubj.$.length > 0
                ? (getSubject(result.value.responsibleSubj.$) as PPerson)
                : null;

            const imageHashes = result.value.$images.$.map(
              state => state.$
            ).filter(Boolean);

            const observation = newPObservation({
              name: result.value.name.$,
              author: accountable,
              locations: {
                [location.identifier]: location,
              },
              images: imageHashes.reduce(
                (images, hash) => {
                  images[`$${hash}`] = hash;
                  return images;
                },
                {} as Record<string, string>
              ),
            });

            onSubmit(
              newPTask({
                name: result.value.name.$,

                ...(result.value.deliverable.$
                  ? { deliverable: result.value.deliverable.$ }
                  : {}),

                assigned: {
                  [accountable.identifier]: {
                    sortIndex: 0,
                    progress: result.value.progress.$,
                    person: accountable,
                  },
                  ...(responsible
                    ? {
                        [responsible.identifier]: {
                          sortIndex: 1,
                          progress: 0,
                          person: responsible,
                        },
                      }
                    : {}),
                },
                basedOn: { [observation.identifier]: observation },
              })
            );
          }
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
          <Box justify="end" direction="row" gap="medium" gridArea="buttons">
            <Button
              label="Annuleren"
              onClick={() => window.history.back()}
              disabled={form.validating}
            />
            <Button
              primary
              type="submit"
              icon={<Save />}
              label="Opslaan"
              disabled={form.hasError || form.validating}
            />
          </Box>

          <Box gridArea="search" />

          <Box gridArea="left">
            <Heading level="3">Taak</Heading>

            <TextField
              label="Naam"
              placeholder="Taak naam"
              required
              fieldState={form.$.name}
            />
            <TextAreaField
              label="Op te leveren"
              placeholder="Beschrijf kort het op te leveren resultaat"
              fieldState={form.$.deliverable}
            />
          </Box>

          <Box gridArea="right">
            <Heading level="3">Toewijzen</Heading>
            <ProgressField
              label={`Waargenomen voortgang`}
              fieldState={form.$.progress}
            />
            <SelectPersonField
              label="Verantwoordelijk"
              fieldState={form.$.responsibleSubj}
            />
            <Heading level="3">Waarneming</Heading>
            {form.$.$images.$.map(($imageFieldState, index) => (
              <PhotoField
                key={index}
                label="Foto"
                fieldState={$imageFieldState}
              />
            ))}
            <Button
              icon={<Add />}
              onClick={action(() => form.$.$images.$.push(new FieldState('')))}
            />
          </Box>
        </Grid>
        {/* <pre>{JSON.stringify(form.$, null, 2)}</pre> */}
      </form>
    </Page>
  );
});

/*
     // return (
    //   <Page>
    //     <Formik
    //       initialValues={initialValues}
    //       validationSchema={pTaskSchema}
    //       validateOnBlur={submitted}
    //       validateOnChange={submitted}
    //       onSubmit={async (values, helpers) => {
    //         console.log(JSON.stringify(values, null, 2));
    //         debugger;
    //         try {
    //           await onSubmit(values);
    //         } finally {
    //           helpers.setSubmitting(false);
    //         }
    //       }}
    //       render={({
    //         handleSubmit,
    //         isSubmitting,
    //         errors,
    //         setFieldValue,
    //         values,
    //       }) => (
    //         <form
    //           onSubmit={e => {
    //             e.preventDefault();
    //             setSubmitted(true);
    //             handleSubmit();
    //           }}
    //         >
    //           <pre>Values {JSON.stringify(values, null, 2)}</pre>
    //           <pre>Errors {JSON.stringify(errors, null, 2)}</pre>
    //           <Grid
    //             fill
    //             rows={['auto', 'auto', 'auto']}
    //             columns={['auto', 'auto']}
    //             areas={[
    //               // { name: 'header', start: [0, 0], end: [1, 0] },
    //               { name: 'buttons', start: [0, 0], end: [1, 0] },
    //               { name: 'search', start: [0, 1], end: [0, 1] },
    //               { name: 'left', start: [0, 2], end: [0, 2] },
    //               { name: 'right', start: [1, 2], end: [1, 2] },
    //             ]}
    //             gap="medium"
    //           >
    //             <Box
    //               justify="end"
    //               direction="row"
    //               gap="medium"
    //               gridArea="buttons"
    //             >
    //               <Button
    //                 label="Annuleren"
    //                 onClick={() => window.history.back()}
    //                 disabled={isSubmitting}
    //               />
    //               <Button
    //                 primary
    //                 type="submit"
    //                 icon={<Save />}
    //                 label="Opslaan"
    //                 disabled={isSubmitting}
    //               />
    //             </Box>

    //             <Box gridArea="search" />

    //             <Box gridArea="left">
    //               <Heading level="3">Taak</Heading>

    //               <TextField
    //                 label="Naam"
    //                 name="name"
    //                 placeholder="Taak naam"
    //                 required
    //               />
    //               <TextField
    //                 label="Op te leveren"
    //                 name="deliverable"
    //                 placeholder="Beschrijf kort het op te leveren resultaat"
    //               />
    //             </Box>

    //             <Box gridArea="right">
    //               <Heading level="3">Toewijzen</Heading>
    //               <ProgressField
    //                 label={`Waargenomen voortgang`}
    //                 name={`assigned.${accountable.identifier}.progress`}
    //               />

    //               <PersonField
    //                 label="Verantwoordelijk"
    //                 name="assigned"
    //                 onChange={person => {
    //                   const assigned = {
    //                     [accountable.identifier]:
    //                       values.assigned[accountable.identifier],
    //                     [person.identifier]: {
    //                       sortIndex: 1,
    //                       progress: 0,
    //                       person,
    //                     },
    //                   };
    //                   setFieldValue('assigned', assigned);
    //                 }}
    //               />
    //             </Box>
    //           </Grid>
    //         </form>
    //       )}
    //     />

 */
