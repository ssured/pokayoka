import React from 'react';
import { storiesOf } from '@storybook/react';
import { Page, PageTitle } from './Page';
import { Grommet, Box } from 'grommet';

storiesOf('Page', module)
  .add('context', () => (
    <Grommet full plain>
      <Box fill pad="medium">
        <PageTitle prefix="Project" title="Molukkenstraat" href="/hello">
          <PageTitle prefix="Locatie" title="Groningen" href="/hello/grunn">
            <Page>Content</Page>
          </PageTitle>
        </PageTitle>
      </Box>
    </Grommet>
  ))
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
