import { navigate } from '@reach/router';
import {
  Box,
  BoxProps,
  Grid,
  Heading,
  ResponsiveContext,
  Button,
} from 'grommet';
import React, { ReactNode, useContext, useState } from 'react';
import { UI_EMPTY_STRING } from '../../constants';
import { colorsLightToDark, sizesSmallToBig } from '../../theme';

const PageTitlesContext = React.createContext<[ReactNode, ReactNode?][][]>([]);

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
  titles: [ReactNode, ReactNode?][][];
  totalHeight?: number;
  titleSeparator?: [ReactNode, ReactNode?];
}> = ({
  border,
  titles = [],
  depth = 0,
  totalHeight = titles.length,
  titleSeparator = ['/'],
}) => {
  const [showingTitle, setShowingTitle] = useState<ReactNode>(undefined);
  const toggleShowingTitle = (title: ReactNode) =>
    setShowingTitle(showingTitle === title ? undefined : title);

  const crumbs = titles[0];
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
          direction="row"
          align="center"
          pad={{ horizontal: 'medium' }}
          style={{ zIndex: 1 }}
          background={colorsLightToDark[depth]}
        >
          {Object.values(crumbs)
            .reduce(
              (entries, crumb, i) => {
                if (i > 0 && titleSeparator) {
                  entries.push(titleSeparator);
                }
                entries.push(crumb);
                return entries;
              },
              [] as [ReactNode, ReactNode?][]
            )
            .map(([title, subTitle], index) => (
              // @ts-ignore
              <Box
                as={subTitle ? Button : Box}
                active={showingTitle === subTitle}
                key={index}
              >
                <Heading
                  level={depth === 0 ? '2' : '3'}
                  margin={{ horizontal: 'small', vertical: 'xsmall' }}
                  // style={{ cursor: subTitle ? 'pointer' : undefined }}
                  onClick={
                    subTitle ? () => toggleShowingTitle(subTitle) : undefined
                  }
                >
                  {title}
                </Heading>
              </Box>
            ))}
        </Box>
        {showingTitle && (
          <Box fill="horizontal" align="center">
            {showingTitle}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export const Page: React.FunctionComponent<{
  titles?: [ReactNode, ReactNode?][][];
  leftOfTitle?: ReactNode;
  rightOfTitle?: ReactNode;
}> = ({
  titles = useContext(PageTitlesContext),
  children,
  rightOfTitle,
  leftOfTitle,
}) => {
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
      <Box gridArea="title" justify="end">
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

      <Box
        gridArea="left-of-title"
        border={{ ...border, side: 'bottom' }}
        align="start"
        justify="end"
      >
        {leftOfTitle}
      </Box>
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
