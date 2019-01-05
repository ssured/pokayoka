import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

import { ColorPicker } from './ColorPicker';

const stories = storiesOf('Elements', module);

const ColorPickerTest: React.SFC<{}> = ({}) => {
  const [color, setColor] = useState<string>('red');
  return (
    <div style={{ textAlign: 'center' }}>
      <ColorPicker
        color={color}
        colors={['red', 'blue', 'green', 'black', 'purple']}
        setColor={setColor}
      />
    </div>
  );
};

stories.add('ColorPicker', () => <ColorPickerTest />);
