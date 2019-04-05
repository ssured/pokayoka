import React from 'react';
import { useObserver, observer } from 'mobx-react-lite';
import { Heading, Box, Image as GImage } from 'grommet';
import { RouteComponentProps } from '@reach/router';
import styled from 'styled-components';

import PDFMap from '../../components/map/leaflet/image-map';
import TileImage from '../../components/map/leaflet/tile-image';
import { SheetModel } from './model';
import { subj } from '../../utils/spo';

const LoadingIndicator = () => <p>Loading...</p>;
const ErrorMessage = (error: Error) => (
  <h3>Uh oh, something happened {error.message}</h3>
);

const ITEM_HEIGHT = 150;

const Grid = styled(Box)`
  height: 100%;

  display: grid;
  grid-gap: 2px;

  grid-template-areas:
    'header '
    'body   '
    'footer ';
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 1fr;
`;

const Header = styled(Heading)`
  grid-area: header;
`;
const Body = styled.div`
  grid-area: body;
  /* min-height: 300px; */
  /* background: yellow; */
  display: flex;
  flex-direction: column;
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

export const SheetMap: React.FunctionComponent<{
  sheet: [SheetModel, subj];
}> = observer(({ sheet: [sheet, subj] }) => {
  console.log('render');
  return (
    <Grid>
      <Header level="3">{sheet.name}</Header>

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
            availableZoomLevels={sheet.availableZoomLevels}
            urlForXYZ={sheet.urlForXYZ.bind(sheet)}
          />
        </PDFMap>
      </Body>

      <Footer>
        <li>
          Prefix: {sheet.width} {sheet.height}{' '}
          {/* {sheet.availableZoomLevels.join(',')} */}
        </li>
        {/* <li>src: {sheet.urlForXYZ(0, 0, 1)}</li> */}
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
  );
});
