import React from 'react';
import { storiesOf } from '@storybook/react';
import { Page } from './Page';
import { Grommet, Box } from 'grommet';

storiesOf('Page', module)
  .add('nested', () => (
    <Grommet full plain>
      <Box fill pad="medium">
        <Page
          titles={[
            ['2e verdieping', '/subsub'],
            ['Molukkenstraat 5', '/subsub'],
            ['Groningen', '/sub'],
            ['Molukkenstraat', '/hello'],
          ]}
        >
          Content
        </Page>
      </Box>
    </Grommet>
  ))
  .add('single', () => (
    <Grommet full plain>
      <Box fill pad="medium">
        <Page titles={[['Hello', '/hello']]}>Content</Page>
      </Box>
    </Grommet>
  ));
