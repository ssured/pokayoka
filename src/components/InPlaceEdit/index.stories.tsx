import React from 'react';
import { storiesOf } from '@storybook/react';
import { Grommet, Box, Text, TextInput, Button } from 'grommet';
import { observer } from 'mobx-react-lite';
import { useLens } from '../../hooks/lens';
import { grommet } from 'grommet/themes';

type Shape = {
  data: string;
};

const shapee: Shape = { data: 'value' };

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const Simple: React.FunctionComponent<{}> = observer(({}) => {
  const shape = useLens({
    getter: () => delay(300).then(() => shapee),
    setter: async value => {
      Object.assign(shapee, value);
      await delay(300);
    },
  });

  return (
    <Grommet full theme={grommet}>
      <Box direction="row" fill="horizontal">
        {shape.fold({
          show: value => (
            <Box fill="horizontal">
              <Text>{value.data}</Text>
            </Box>
          ),
          edit: ([value, setValue]) => (
            <TextInput
              value={value.data}
              onChange={e => {
                setValue({ ...value, data: e.target.value });
              }}
            />
          ),
        })}

        {shape.fold({
          busy: () => null,
          show: (_, { editButtonProps }) => (
            <Button {...editButtonProps} label="Edit" />
          ),
          edit: (_, { saveButtonProps, cancelButtonProps }) => (
            <>
              <Button {...saveButtonProps} label="Save" />{' '}
              <Button {...cancelButtonProps} label="Cancel" />
            </>
          ),
        })}
      </Box>
    </Grommet>
  );
});

storiesOf('InPlaceEdit', module).add('simple', () => <Simple />);
