import React, { ReactNode } from 'react';
import { Box, Heading, Grid } from 'grommet';
import { navigate } from '@reach/router';

const colorsLightToDark = [
  'white',
  'light-1',
  'light-2',
  'light-3',
  'light-4',
  'dark-4',
  'dark-3',
  'dark-2',
  'dark-1',
  'black',
];

const sizesSmallToBig = [
  'none',
  'xsmall',
  'small',
  'medium',
  'large',
  'xlarge',
];

export const Title: React.FunctionComponent<{}> = ({ children }) => {
  return <Heading level="2">{children}</Heading>;
};

interface Border {
  color: string;
  size: string;
}

const Tab: React.FunctionComponent<{
  border: Border;
  depth?: number;
  titles: [string, string?][];
  totalHeight?: number;
}> = ({ border, titles = [], depth = 0, totalHeight = titles.length }) => {
  const [title, href] = titles[0];
  const ancestors = titles.slice(1);
  return (
    <Box margin={{ horizontal: depth > 0 ? 'medium' : undefined }}>
      <Box align="center" border={{ ...border, side: 'bottom' }}>
        {ancestors.length > 0 && (
          <Tab
            border={border}
            depth={depth + 1}
            titles={ancestors}
            totalHeight={totalHeight}
          />
        )}
      </Box>
      <Box
        as="a"
        align="center"
        border={{ ...border, side: 'vertical' }}
        pad={{ horizontal: 'medium' }}
        onClick={href == null ? undefined : () => navigate(href)}
        style={{ cursor: 'pointer' }}
        background={colorsLightToDark[depth]}
        elevation={sizesSmallToBig[totalHeight - depth]}
      >
        <Heading
          level={depth === 0 ? '1' : '3'}
          margin={{ horizontal: 'medium', vertical: 'xsmall' }}
        >
          {title}
        </Heading>
      </Box>
    </Box>
  );
};

export const Page: React.FunctionComponent<{
  titles: [string, string?][];
  rightOfTitle?: ReactNode;
}> = ({ titles, children, rightOfTitle }) => {
  const border: Border = {
    color: 'border',
    size: 'xsmall',
  };
  const pad = 'medium';

  return (
    <Grid
      fill
      rows={['auto', 'flex', 'auto']}
      columns={['flex', 'auto', 'flex']}
      areas={[
        { name: 'title', start: [1, 0], end: [1, 0] },
        { name: 'left-of-title', start: [0, 0], end: [0, 0] },
        { name: 'right-of-title', start: [2, 0], end: [2, 0] },
        { name: 'content', start: [0, 1], end: [2, 1] },
        { name: 'below-content', start: [0, 2], end: [2, 2] },
      ]}
    >
      <Box gridArea="title">
        <Tab border={border} titles={titles} />
      </Box>

      <Box
        gridArea="content"
        width="full"
        border={{ ...border, side: 'vertical' }}
        pad={pad}
        elevation={sizesSmallToBig[titles.length]}
        background="white"
      >
        {children}
      </Box>

      <Box gridArea="left-of-title" border={{ ...border, side: 'bottom' }} />
      <Box
        gridArea="right-of-title"
        border={{ ...border, side: 'bottom' }}
        align="end"
        justify="end"
        pad="xsmall"
      >
        {rightOfTitle}
      </Box>
      <Box gridArea="below-content" border={{ ...border, side: 'top' }} />
    </Grid>
  );
};
