import { Box, ButtonProps, Keyboard, Text, TextInput } from 'grommet';
import { useObserver } from 'mobx-react-lite';
import React, { useState, ReactNode } from 'react';
import { TextButton } from '../components/TextButton';
import { SPOShape } from '../utils/spo';
import { KeysOfType } from '../utils/typescript';
import { Maybe } from '../utils/universe';

const TextInputStatic: React.FunctionComponent<{}> = ({ children }) => (
  <Text truncate>{children}</Text>
);

type ShowComponent<T> = (
  value: T,
  actions: { editButtonProps: ButtonProps; edit: () => void }
) => ReactNode;

type EditComponent<T> = (
  state: [T, (value: T) => void],
  actions: {
    saveButtonProps: ButtonProps;
    save: () => void;
    cancelButtonProps: ButtonProps;
    cancel: () => void;
  }
) => ReactNode;

interface EditInlineStringPropProps<T extends SPOShape> {
  subject: Maybe<T>;
  prop: KeysOfType<Maybe<T>, string | undefined>;
  rtl?: boolean;
  show?: ShowComponent<string | undefined>;
  edit?: EditComponent<string | undefined>;
  placeholder?: string;
}

export function EditInlineStringProp<T extends SPOShape>({
  subject,
  prop,
  rtl,
  placeholder,
  show = value => (
    <TextInputStatic>
      {value || <Text color={'light-4'}>{placeholder}</Text>}
    </TextInputStatic>
  ),
  edit = ([value, setValue], { cancel, save }) => (
    <Keyboard onEsc={cancel} onEnter={save}>
      <TextInput
        value={value || ''}
        onChange={e => {
          setValue(e.target.value);
        }}
        placeholder={placeholder}
      />
    </Keyboard>
  ),
}: EditInlineStringPropProps<T>): ReturnType<
  React.FunctionComponent<EditInlineStringPropProps<T>>
> {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<string>('');

  const editAction = () => {
    setIsEditing(true);
    setValue((subject[prop] || '') as string);
  };
  const editButtonProps: ButtonProps = { plain: true, onClick: editAction };
  const cancelAction = () => {
    setIsEditing(false);
    setValue('');
  };
  const cancelButtonProps: ButtonProps = { plain: true, onClick: cancelAction };
  const saveAction = () => {
    setIsEditing(false);
    // @ts-ignore
    subject[prop] = value;
    setValue('');
  };
  const saveButtonProps: ButtonProps = { plain: true, onClick: saveAction };

  return useObserver(() => {
    const input = (
      <Box justify="center">
        {isEditing
          ? edit([value, setValue as any], {
              cancel: cancelAction,
              save: saveAction,
              cancelButtonProps,
              saveButtonProps,
            })
          : show(subject[prop] as any, { editButtonProps, edit: editAction })}
      </Box>
    );
    const button = (
      <Box justify="center">
        {isEditing ? (
          <Box direction="row" gap="medium">
            <TextButton {...saveButtonProps} label="Opslaan" />
            <TextButton {...cancelButtonProps} label="Annuleren" />
          </Box>
        ) : (
          <TextButton {...editButtonProps} label="Bewerk" />
        )}
      </Box>
    );
    return rtl ? (
      <>
        {button}
        {input}
      </>
    ) : (
      <>
        {input}
        {button}
      </>
    );
  });
}
