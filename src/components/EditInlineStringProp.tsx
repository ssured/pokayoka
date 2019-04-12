import { Box, Keyboard, Text, TextInput } from 'grommet';
import { useObserver } from 'mobx-react-lite';
import React from 'react';
import { TextButton } from '../components/TextButton';
import { UI_EMPTY_STRING } from '../constants';
import { LensEditComponent, LensShowComponent, useLens } from '../hooks/lens';
import { setSubject } from '../model/base';
import { SPOShape } from '../utils/spo';
import { UndefinedOrPartialSPO } from '../utils/spo-observable';
import { KeysOfType } from '../utils/typescript';

const TextInputStatic: React.FunctionComponent<{}> = ({ children }) => (
  <Text truncate>{children}</Text>
);

interface EditInlineStringPropProps<T extends SPOShape> {
  subject: UndefinedOrPartialSPO<T>;
  prop: KeysOfType<Required<T>, string>;
  rtl?: boolean;
  show?: LensShowComponent<string | undefined>;
  edit?: LensEditComponent<string | undefined>;
}

export function EditInlineStringProp<T extends SPOShape>({
  subject,
  prop,
  rtl,
  show = value => <TextInputStatic>{value}</TextInputStatic>,
  edit = ([value, setValue], { cancel, save }) => (
    <Keyboard onEsc={cancel} onEnter={save}>
      <TextInput
        value={value || UI_EMPTY_STRING}
        onChange={e => {
          setValue(e.target.value);
        }}
      />
    </Keyboard>
  ),
}: EditInlineStringPropProps<T>): ReturnType<
  React.FunctionComponent<EditInlineStringPropProps<T>>
> {
  const lens = useLens(
    {
      getter: () => subject[prop] as string | undefined,
      setter: value => setSubject(subject, prop, value as any),
    },
    [subject, prop]
  );
  return useObserver(() => {
    const value = (
      <Box justify="center">
        {lens.fold({
          show,
          edit,
        })}
      </Box>
    );
    const button = (
      <Box justify="center">
        {lens.fold({
          busy: () => null,
          show: (_, { editButtonProps }) => (
            <TextButton {...editButtonProps} label="Edit" />
          ),
          edit: (_, { saveButtonProps, cancelButtonProps }) => (
            <Box direction="row" gap="medium">
              <TextButton {...saveButtonProps} label="Save" />
              <TextButton {...cancelButtonProps} label="Cancel" />
            </Box>
          ),
        })}
      </Box>
    );
    return rtl ? (
      <>
        {button}
        {value}
      </>
    ) : (
      <>
        {value}
        {button}
      </>
    );
  });
}
