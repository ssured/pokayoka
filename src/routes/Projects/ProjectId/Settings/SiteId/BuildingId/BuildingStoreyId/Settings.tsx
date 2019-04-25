import { navigate } from '@reach/router';
import { Box, Grid, Image, ResponsiveContext, Stack, Text } from 'grommet';
import { Add } from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { Map, Marker, TileLayer } from 'react-leaflet';
import { EditInlineStringProp } from '../../../../../../../components/EditInlineStringProp';
import { PageSection } from '../../../../../../../components/Page/PageSection';
import { TextButton } from '../../../../../../../components/TextButton';
import { Maybe } from '../../../../../../../utils/universe';

export const Settings: React.FunctionComponent<{
  buildingStorey: Maybe<PBuildingStorey>;
}> = observer(({ buildingStorey }) => {
  const size = useContext(ResponsiveContext);
  return (
    <>
      <Grid
        align="start"
        columns={
          size === 'small' ? undefined : { count: 'fill', size: 'medium' }
        }
        gap="medium"
      >
        <Grid columns={['flex', 'auto']} gap="medium">
          <EditInlineStringProp subject={buildingStorey} prop="name" />
        </Grid>
        <Box height="small">
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
              <Text size="large">{buildingStorey.name}</Text>
            </Box>
          </Stack>
        </Box>
      </Grid>

      <PageSection
        heading="Plattegronden"
        action={
          <TextButton
            onClick={() =>
              navigate([window.location.pathname, 'add-sheet'].join('/'))
            }
          >
            <Add size="small" color="currentColor" /> plattegrond
          </TextButton>
        }
      />

      {/* <Grid
          align="start"
          columns={
            size === 'small' ? undefined : { count: 'fill', size: 'medium' }
          }
          gap="medium"
        >
          {Object.entries(buildingStorey.sheets || {}).map(
            ([key, sheet]) =>
              sheet && (
                <Box
                  key={key}
                  direction="column"
                  align="center"
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    navigate([window.location.pathname, key].join('/'))
                  }
                >
                  {sheet.$thumb && (
                    <Box fill>
                      <Image src={`/cdn/${sheet.$thumb}`} fit="contain" />
                    </Box>
                  )}
                  <Text size="large" truncate>
                    {sheet.name}
                  </Text>
                   <Box direction="row">
                    <EditInlineStringProp subject={buildingStorey} prop="name" />
                  </Box> 
                </Box>
              )
          )}
        </Grid> */}
    </>
  );
});
