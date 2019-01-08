import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

import { Card } from './Card';
import { Box } from '../base';
import css from '@emotion/css';
import { minireset } from '../base/minireset';
import { generic } from '../base/generic';
import styled from '@emotion/styled';

const stories = storiesOf('Elements', module);

const Reset = styled('div')(minireset, generic);

stories.add(
  'Card',
  withInfo({ inline: true })(() => (
    <Reset>
      <Card>
        <Card.Header>
          <Card.HeaderTitle>
            <h1>Yo dudes</h1>
          </Card.HeaderTitle>
        </Card.Header>
        <Card.Content>
          <p>Content</p>
        </Card.Content>
        <Card.Footer>Footer</Card.Footer>
      </Card>
    </Reset>
  ))
);
