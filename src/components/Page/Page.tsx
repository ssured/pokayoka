import { navigate } from '@reach/router';
import { Box, Grid, Heading, ResponsiveContext } from 'grommet';
import React, { ReactNode, useContext } from 'react';
import { UI_EMPTY_STRING } from '../../constants';
import { colorsLightToDark, sizesSmallToBig } from '../../theme';

const PageTitlesContext = React.createContext<
  [ReactNode, string | undefined][]
>([]);

export const PageTitle: React.FunctionComponent<{
  /**
   * prefix, only shown if screen wider than small
   */
  prefix: string | undefined;

  /**
   * title of the page, if undefined defaults to UI_EMTPY_STRING constant
   */
  title: string | undefined;

  /**
   * absolute link, or relative when starting with './'
   */
  href: string | undefined;
}> = ({ prefix, title, href, children }) => {
  const current = useContext(PageTitlesContext);
  const size = useContext(ResponsiveContext);

  // parse relative links, which start with './'
  const link =
    href && href.match(/^\.\//) ? current[0][1] + href.substr(1) : href;

  return (
    <PageTitlesContext.Provider
      value={[
        [
          size !== 'small' && prefix ? (
            <>
              <small>{prefix}:</small> {title || UI_EMPTY_STRING}
            </>
          ) : (
            title || UI_EMPTY_STRING
          ),
          link,
        ],
        ...current,
      ]}
    >
      {children}
    </PageTitlesContext.Provider>
  );
};

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
  titles: [ReactNode, string?][];
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
        border={{ ...border, side: 'vertical' }}
        elevation={sizesSmallToBig[totalHeight - depth]}
      >
        <Box
          as="a"
          align="center"
          pad={{ horizontal: 'medium' }}
          onClick={href == null ? undefined : () => navigate(href)}
          style={{ cursor: 'pointer', zIndex: 1 }}
          background={colorsLightToDark[depth]}
        >
          <Heading
            level={depth === 0 ? '2' : '3'}
            margin={{ horizontal: 'medium', vertical: 'xsmall' }}
          >
            {title}
          </Heading>
        </Box>
      </Box>
    </Box>
  );
};

export const Page: React.FunctionComponent<{
  titles?: [ReactNode, string?][];
  rightOfTitle?: ReactNode;
}> = ({ titles = useContext(PageTitlesContext), children, rightOfTitle }) => {
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
