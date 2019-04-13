import { RouteComponentProps, Router, navigate } from '@reach/router';
import { Box, Grid, Text, Stack, Image } from 'grommet';
import { Add } from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { useToggle } from 'react-use';
import { EditInlineStringProp } from '../../components/EditInlineStringProp';
import { Page, PageTitle } from '../../components/Page/Page';
import { PageSection } from '../../components/Page/PageSection';
import { TextButton } from '../../components/TextButton';
import { SPOContext, useQuery } from '../../contexts/spo-hub';
import { PartialBuildingStorey } from '../../model/BuildingStorey/model';
import { subj } from '../../utils/spo';
import { Map, TileLayer, Marker } from 'react-leaflet';

export const BuildingStoreyPage: React.FunctionComponent<
  RouteComponentProps<{ buildingStoreyKey: string }> & {
    projectCode: string;
    siteKey: string;
    buildingKey: string;
  }
> = observer(({ projectCode, buildingStoreyKey, siteKey, buildingKey }) => {
  const { get } = useContext(SPOContext);
  const q = useQuery(v => [{ s: v('s'), p: 'code', o: projectCode }]);

  // console.log(`query:${JSON.stringify(q, null, 2)}`);

  const buildingStorey =
    q.length === 1
      ? (get(
          (q[0].variables.s as subj).concat(
            'sites',
            siteKey,
            'buildings',
            buildingKey,
            'buildingStoreys',
            buildingStoreyKey!
          )
        ) as PartialBuildingStorey)
      : undefined;

  if (buildingStorey) {
    return (
      <PageTitle title={buildingStorey.name} href={`./${buildingStoreyKey}`}>
        <Router>
          <BuildingStoreyFrame path="/" {...{ buildingStorey }} />
        </Router>
      </PageTitle>
    );
  }

  return <div>Loading buildingStorey</div>;
});

const BuildingStoreyFrame: React.FunctionComponent<
  RouteComponentProps<{}> & {
    buildingStorey: PartialBuildingStorey;
  }
> = ({ buildingStorey }) => {
  const [showEdit, toggleEdit] = useToggle(false);

  return (
    <Page
      rightOfTitle={
        <TextButton
          label={showEdit ? 'verwijder verdieping' : 'wijzig verdieping'}
          onClick={() => toggleEdit()}
        />
      }
    >
      {showEdit ? (
        <BuildingStoreyEdit buildingStorey={buildingStorey} />
      ) : (
        <BuildingStoreyShow buildingStorey={buildingStorey} />
      )}
    </Page>
  );
};

const BuildingStoreyShow: React.FunctionComponent<{
  buildingStorey: PartialBuildingStorey;
}> = observer(({ buildingStorey }) => {
  return (
    <>
      <Box direction="row" justify="between">
        <Box>
          <Grid columns={['flex', 'auto']} gap="medium">
            <EditInlineStringProp subject={buildingStorey} prop="name" />
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
              <Text size="large">{buildingStorey.name}</Text>
            </Box>
          </Stack>
        </Box>
      </Box>

      <PageSection
        heading="Plattegronden"
        action={
          <TextButton>
            <Add size="small" color="currentColor" /> plattegrond
          </TextButton>
        }
      />

      <Grid columns={['1/3']} rows={['small']} gap="medium">
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
                    <Image src={`/cdn/${sheet.$thumb}`} fit="cover" />
                  </Box>
                )}
                <Text size="large" truncate>
                  {sheet.name}
                </Text>
                {/* <Box direction="row">
                  <EditInlineStringProp subject={buildingStorey} prop="name" />
                </Box> */}
              </Box>
            )
        )}
      </Grid>
    </>
  );
});

const BuildingStoreyEdit: React.FunctionComponent<{
  buildingStorey: PartialBuildingStorey;
}> = observer(({ buildingStorey }) => {
  return <Text>Edit {buildingStorey.name}</Text>;
});
