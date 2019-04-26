import { navigate } from '@reach/router';
import {
  Box,
  Grid,
  Image,
  ResponsiveContext,
  Stack,
  Text,
  Button,
} from 'grommet';
import { Add, Checkmark } from 'grommet-icons';
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
        fill="horizontal"
        columns={
          size === 'small' ? undefined : { count: 'fill', size: 'medium' }
        }
        gap="medium"
      >
        <Grid columns={['flex', 'auto']} gap="medium">
          <EditInlineStringProp subject={buildingStorey} prop="name" />
        </Grid>

        <Box>
          {buildingStorey.activeSheet && buildingStorey.activeSheet.$thumb && (
            <Box width="medium" height="small">
              <Image
                src={`/cdn/${buildingStorey.activeSheet.$thumb}`}
                fit="contain"
              />
            </Box>
          )}
        </Box>
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
        {Object.entries(buildingStorey.sheets)
          .reverse()
          .map(([key, sheet]) => {
            if (sheet == null) return;

            // TODO more core level comparison between objects
            // universe should provide an isEqual function
            const isActiveSheet =
              buildingStorey.activeSheet &&
              buildingStorey.activeSheet.identifier === sheet.identifier;

            return (
              <Box
                key={key}
                direction="column"
                align="center"
                border={
                  isActiveSheet
                    ? { color: 'accent-3', side: 'all', size: 'medium' }
                    : undefined
                }
                pad="medium"
                gap="medium"
              >
                <Button
                  icon={isActiveSheet ? <Checkmark /> : undefined}
                  label={isActiveSheet ? 'Actieve plattegrond' : 'Activeer'}
                  primary={isActiveSheet}
                  onClick={() => {
                    buildingStorey.activeSheet = isActiveSheet
                      ? undefined
                      : sheet;
                  }}
                />
                {sheet.$thumb && (
                  <Box fill>
                    <Image src={`/cdn/${sheet.$thumb}`} fit="contain" />
                  </Box>
                )}
                <Box direction="column" gap="small" align="center">
                  <EditInlineStringProp subject={sheet} prop="name" />
                </Box>
              </Box>
            );
          })}
      </Grid>
    </>
  );
});
