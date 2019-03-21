import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { Heading, Box, Image as GImage } from 'grommet';
import { RouteComponentProps } from '@reach/router';
import { useProjectId } from '.';
import { useModel, useQuery } from '../../contexts/store';
import { Project } from '../../models/Project';
import { Sheet as SheetModel } from '../../models/Sheet';
import { FixedSizeList } from 'react-window';
import styled from 'styled-components';

import XYZ from 'ol/source/xyz';
import Projection from 'ol/proj/projection';
import TileGrid from 'ol/tilegrid/tilegrid';

import {
  interaction,
  layer,
  custom,
  control, // name spaces
  Interactions,
  Overlays,
  Controls, // group
  Map,
  Layers,
  Overlay,
  Util, // objects
} from '@sirmcpotato/react-openlayers';

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
          <Body>
            <Map
              view={{
                center: [0, 0],
                zoom: 3,
              }}
            >
              <Layers>
                <layer.Tile
                  source={
                    new XYZ({
                      tileSize: [1024, 1024],
                      tileUrlFunction: (coords, pixelRatio, proj) => {
                        const [z, x, y] = coords;
                        console.log({ coords, pixelRatio, proj });
                        const url = sheet.urlFor(z + 1, x, -y) || '';
                        console.log(url, z + 1, x, -y);
                        return url;
                      },
                    })
                  }
                />
                {/* <layer.Vector source={markers} style={markers.style} zIndex="1" /> */}
              </Layers>
              {/* <Overlays>
              <Overlay
                ref={comp => (this.overlayComp = comp)}
                element="#popup"
              />
            </Overlays> */}
              <Controls attribution={false} zoom={true}>
                {/* <control.Rotate /> */}
                <control.ScaleLine />
                {/* <control.FullScreen /> */}
                <control.OverviewMap />
                {/* <control.ZoomSlider /> */}
                {/* <control.ZoomToExtent /> */}
                <control.Zoom />
              </Controls>
              {/* <Interactions>
              <interaction.Select style={selectedMarkerStyle} />
              <interaction.Draw source={markers} type="Point" />
              <interaction.Modify features={markers.features} />
            </Interactions> */}
            </Map>
          </Body>

          {/* <custom.Popup ref={comp => (this.popupComp = comp)} /> */}
          <Footer>
            <li>
              Prefix: {sheet.prefix} {sheet.width} {sheet.height}{' '}
              {sheet.availableZoomLevels}
            </li>
            <li>src: {sheet.urlFor(1, 0, 0)}</li>
            {sheet.urlFor(1, 0, 0) && (
              <li>
                <GImage fit="contain" src={sheet.urlFor(1, 0, 0)!} />
              </li>
            )}
            {[...sheet.tiles.entries()].map(([key, value]) => (
              <li key={key}>
                {key} {JSON.stringify(value)}
              </li>
            ))}
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
