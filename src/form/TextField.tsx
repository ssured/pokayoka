import { useField } from 'formik';
import { FormField, TextInput, TextInputProps } from 'grommet';
import React from 'react';
import { ifExists } from '../utils/universe';

export const TextField: React.FunctionComponent<
  TextInputProps & {
    name: string;
    label: string;
    placeholder?: string;
    required?: boolean;
  }
> = ({ label, required, ...props }) => {
  const [field, meta] = useField(props.name);
  return (
    <FormField
      {...{
        label: label + (required ? ' *' : ''),
        error: meta.touched ? meta.error : undefined,
      }}
    >
      <TextInput
        required={required}
        {...{ ...field, value: ifExists(field.value) || '' }}
        {...props}
      />
    </FormField>
  );
};
