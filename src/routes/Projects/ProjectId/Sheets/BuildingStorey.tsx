import { observer, useObservable } from 'mobx-react-lite';
import React from 'react';
import { Page } from '../../../../components/Page/Page';
import { Maybe } from '../../../../utils/universe';
import { Stack, Text } from 'grommet';

import PDFMap from '../../../../components/map/leaflet/image-map';
import TileImage from '../../../../components/map/leaflet/tile-image';
import { isPSheet } from '../../../../model/Sheet/model';
import { CSS_SPREAD_ABSOLUTE } from '../../../../constants';
import { Map } from 'leaflet';

export const BuildingStorey: React.FunctionComponent<{
  buildingStorey: Maybe<PBuildingStorey>;
}> = observer(({ buildingStorey }) => {
  const sheet = buildingStorey.activeSheet;

  if (!isPSheet(sheet)) return <Text>loading...</Text>;

  const data = useObservable({
    get availableZoomLevels() {
      return [
        ...new Set(
          Object.keys(sheet!.images)
            .map(key => key.match(/^\$(\d+)/))
            .filter(match => match != null)
            .map(match => parseInt(match![1], 10))
        ),
      ];
    },
    get urlForXYZ() {
      return (x: number, y: number, z: number) => {
        const hash = sheet!.images[`$${z}/${y}/${x}`];
        return typeof hash === 'string' ? `/cdn/${hash}` : null;
      };
    },
    _center: undefined as [number, number] | undefined,
    get center(): [number, number] {
      return (
        this._center ||
        (isPSheet(sheet)
          ? sheet.width > sheet.height
            ? [-(sheet.height / sheet.width) * 256, 256]
            : [-256, (sheet.width / sheet.height) * 256]
          : [-256, 256])
      );
    },
    set center(center) {
      this._center = center;
    },
    get zoom() {
      return 1;
    },
  });

  return (
    <Page>
      <Stack fill>
        <PDFMap
          center={data.center}
          zoom={data.zoom}
          style={CSS_SPREAD_ABSOLUTE}
          ondragend={e => {
            const map = e.target as Map;
            const { lat, lng } = map.getCenter();
            data.center = [lat, lng];
            const zoom = map.getZoom();

            console.log('drag', lat, lng, zoom, e);
          }}
        >
          <TileImage
            url={null}
            width={sheet.width}
            height={sheet.height}
            availableZoomLevels={data.availableZoomLevels}
            urlForXYZ={data.urlForXYZ}
          />
        </PDFMap>
      </Stack>
    </Page>
  );
});
