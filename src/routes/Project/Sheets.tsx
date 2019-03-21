import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { Heading, Box, Image as GImage } from 'grommet';
import { RouteComponentProps } from '@reach/router';
import { useProjectId } from '.';
import { useModel, useQuery } from '../../contexts/store';
import { Project } from '../../models/Project';
import { Sheet as SheetModel } from '../../models/Sheet';
import styled from 'styled-components';

import PDFMap from '../../components/map/leaflet/image-map';
import TileImage from '../../components/map/leaflet/tile-image';

const LoadingIndicator = () => <p>Loading...</p>;
const ErrorMessage = (error: Error) => (
  <h3>Uh oh, something happened {error.message}</h3>
);

const ITEM_HEIGHT = 150;

const Grid = styled(Box)`
  display: grid;
  grid-gap: 2px;

  border-bottom: 1px solid lightgrey;
  /* > * {
    border: 1px solid lightgrey;
  } */

  grid-template-areas:
    'header '
    'body   '
    'footer ';
  grid-template-rows: 40px 1fr auto;
  grid-template-columns: 1fr;
`;

const Header = styled(Heading)`
  grid-area: header;
`;
const Body = styled.div`
  grid-area: body;
  min-height: 300px;
  background: yellow;

  > .pdfmap {
    height: 500px;
  }
`;
const Footer = styled.ul`
  grid-area: footer;
`;

const UnstyledLabel: React.FunctionComponent<{
  className?: string;
  color?: string;
}> = ({ className, children, color = 'red' }) => (
  <span className={className}>{children}</span>
);

const Label = styled(UnstyledLabel)`
  position: relative;
  background: ${props => props.color};

  &:after,
  &:before {
    right: 100%;
    top: 50%;
    border: solid transparent;
    content: ' ';
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
  }

  &:after {
    border-color: transparent;
    border-right-color: ${props => props.color};
    border-width: 0.65em;
    margin-top: -0.65em;
  }
`;

const Sheet: React.FunctionComponent<{
  sheetId: string;
}> = ({ sheetId }) => {
  const sheet = useModel(SheetModel, sheetId);

  return useObserver(() =>
    sheet.fold(
      LoadingIndicator,
      sheet => (
        <Grid>
          <Header level="3">{sheet.type}</Header>
          {sheet.projectId /* projectId needs to be available for sheet.urlForXYZ to work sync */ && (
            <Body>
              <PDFMap
                center={
                  sheet.width > sheet.height
                    ? [-(sheet.height / sheet.width) * 256, 256]
                    : [-256, (sheet.width / sheet.height) * 256]
                }
                zoom={1}
                className="pdfmap"
              >
                <TileImage
                  url={null}
                  width={sheet.width}
                  height={sheet.height}
                  availableZoomLevels={JSON.parse(sheet.availableZoomLevels)}
                  urlForXYZ={sheet.urlForXYZ}
                />
              </PDFMap>
            </Body>
          )}

          {/* <custom.Popup ref={comp => (this.popupComp = comp)} /> */}
          <Footer>
            <li>
              Prefix: {sheet.prefix} {sheet.width} {sheet.height}{' '}
              {sheet.availableZoomLevels}
            </li>
            <li>src: {sheet.urlForXYZ(0, 0, 1)}</li>
            {/* {sheet.urlForXYZ(0, 0, 1) && (
              <li>
                <GImage fit="contain" src={sheet.urlForXYZ(0, 0, 1)!} />
              </li>
            )}
            {[...sheet.tiles.entries()].map(([key, value]) => (
              <li key={key}>
                {key} {JSON.stringify(value)}
              </li>
            ))} */}
          </Footer>
        </Grid>
      ),
      ErrorMessage
    )
  );
};

export const Sheets: React.FunctionComponent<RouteComponentProps<{}>> = () => {
  const projectId = useProjectId();
  const project = useModel(Project, projectId);

  const query = useQuery<{ sheetId: [string] }>(
    v => [{ s: v('sheetId'), p: 'type', o: 'sheet' }],
    []
  );

  return useObserver(() => (
    <Box>
      {project.fold(
        LoadingIndicator,
        project => (
          <>
            <Heading>Project {project.name}</Heading>
            {query.fold(
              LoadingIndicator,
              results => (
                <Box>
                  {results.map(r => r.sheetId[0]).join(', ')}
                  <Sheet sheetId={results[0].sheetId[0]} />
                </Box>
              ),
              ErrorMessage
            )}
          </>
        ),
        ErrorMessage
      )}
    </Box>
  ));
};
