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
import { router } from '../../../../../../../router';

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
      </Grid>

      <PageSection
        heading="Plattegronden"
        action={
          <TextButton
            onClick={() =>
              router.projects.projectId.settings.siteId.buildingId.buildingStoreyId.addSheet.$push()
            }
          >
            <Add size="small" color="currentColor" /> plattegrond
          </TextButton>
        }
      />

      <Grid
        align="start"
        columns={
          size === 'small' ? undefined : { count: 'fill', size: 'medium' }
        }
        gap="medium"
      >
        {Object.entries(buildingStorey.sheets).map(
          ([key, sheet]) =>
            sheet && (
              <Box key={key} direction="column" align="center">
                {sheet.$thumb && (
                  <Box fill>
                    <Image src={`/cdn/${sheet.$thumb}`} fit="contain" />
                  </Box>
                )}
                <Box direction="row" gap="medium">
                  <EditInlineStringProp subject={sheet} prop="name" />
                </Box>
              </Box>
            )
        )}
      </Grid>
    </>
  );
});
