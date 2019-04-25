import { navigate } from '@reach/router';
import { Box, Grid, Stack, Text } from 'grommet';
import { Add } from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Map, Marker, TileLayer } from 'react-leaflet';
import { EditInlineStringProp } from '../../../../../components/EditInlineStringProp';
import { PageSection } from '../../../../../components/Page/PageSection';
import { TextButton } from '../../../../../components/TextButton';
import { Maybe } from '../../../../../utils/universe';
import { router } from '../../../../../router';

export const Settings: React.FunctionComponent<{
  site: Maybe<PSite>;
}> = observer(({ site }) => {
  return (
    <>
      <Box direction="row" justify="between">
        <Box>
          <Grid columns={['flex', 'auto']} gap="medium">
            <EditInlineStringProp subject={site} prop="name" />
          </Grid>
        </Box>
        <Box width="medium" height="small">
          <Stack fill>
            <Map
              center={[52.2975, 6.318611]}
              zoom={14}
              zoomControl={false}
              attributionControl={false}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0,
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[52.2975, 6.318611]} />
            </Map>
            <Box
              fill
              style={{ zIndex: 1, pointerEvents: 'none' }}
              align="center"
              justify="end"
            >
              <Text size="large">{site.name}</Text>
            </Box>
          </Stack>
        </Box>
      </Box>

      <PageSection
        heading="Gebouwen"
        action={
          <TextButton>
            <Add size="small" color="currentColor" /> gebouw
          </TextButton>
        }
      />

      <Grid fill="horizontal" columns={['1/3']} rows={['small']} gap="medium">
        {Object.entries(site.buildings || {}).map(
          ([key, building]) =>
            building && (
              <Box
                key={key}
                direction="column"
                align="center"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  router.projects.projectId.settings.siteId.buildingId.$push({
                    buildingId: building.identifier,
                  })
                }
              >
                <Stack fill>
                  <Map
                    center={[52.2975, 6.318611]}
                    zoom={14}
                    zoomControl={false}
                    attributionControl={false}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 0,
                    }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[52.2975, 6.318611]} />
                  </Map>
                  <Box
                    fill
                    style={{ zIndex: 1, pointerEvents: 'none' }}
                    align="center"
                    justify="end"
                  >
                    <Text size="large" truncate>
                      {building.name}
                    </Text>
                  </Box>
                </Stack>
                {/* <Box direction="row">
                    <EditInlineStringProp subject={site} prop="name" />
                  </Box> */}
              </Box>
            )
        )}
      </Grid>
    </>
  );
});
