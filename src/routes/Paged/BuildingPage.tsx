import { RouteComponentProps, Router, navigate } from '@reach/router';
import { Box, Grid, Text, Stack } from 'grommet';
import { Add } from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { useToggle } from 'react-use';
import { EditInlineStringProp } from '../../components/EditInlineStringProp';
import { Page, PageTitle } from '../../components/Page/Page';
import { PageSection } from '../../components/Page/PageSection';
import { TextButton } from '../../components/TextButton';
import { SPOContext, useQuery } from '../../contexts/spo-hub';
import { PartialBuilding } from '../../model/Building/model';
import { subj } from '../../utils/spo';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { BuildingStoreyPage } from './BuildingStoreyPage';
import { CSS_SPREAD_ABSOLUTE } from '../../constants';

export const BuildingPage: React.FunctionComponent<
  RouteComponentProps<{ buildingKey: string }> & {
    projectCode: string;
    siteKey: string;
  }
> = observer(({ projectCode, buildingKey, siteKey }) => {
  const { get } = useContext(SPOContext);
  const q = useQuery(v => [{ s: v('s'), p: 'code', o: projectCode }]);

  // console.log(`query:${JSON.stringify(q, null, 2)}`);

  const building =
    q.length === 1
      ? (get(
          (q[0].variables.s as subj).concat(
            'sites',
            siteKey,
            'buildings',
            buildingKey!
          )
        ) as PartialBuilding)
      : undefined;

  if (building) {
    return (
      <PageTitle
        prefix="gebouw"
        title={building.name}
        href={`./${buildingKey}`}
      >
        <Router>
          <BuildingFrame path="/" {...{ building }} />
          <BuildingStoreyPage
            path="/:buildingStoreyKey/*"
            {...{ projectCode, siteKey, buildingKey: buildingKey! }}
          />
        </Router>
      </PageTitle>
    );
  }

  return <div>Loading building</div>;
});

const BuildingFrame: React.FunctionComponent<
  RouteComponentProps<{}> & {
    building: PartialBuilding;
  }
> = ({ building }) => {
  const [showEdit, toggleEdit] = useToggle(false);

  return (
    <Page
      rightOfTitle={
        <TextButton
          label={showEdit ? 'verwijder gebouw' : 'wijzig gebouw'}
          onClick={() => toggleEdit()}
        />
      }
    >
      {showEdit ? (
        <BuildingEdit building={building} />
      ) : (
        <BuildingShow building={building} />
      )}
    </Page>
  );
};

const BuildingShow: React.FunctionComponent<{
  building: PartialBuilding;
}> = observer(({ building }) => {
  return (
    <>
      <Box direction="row" justify="between">
        <Box>
          <Grid columns={['flex', 'auto']} gap="medium">
            <EditInlineStringProp subject={building} prop="name" />
          </Grid>
        </Box>
        <Box width="medium" height="small">
          <Stack fill>
            <Map
              center={[52.2975, 6.318611]}
              zoom={14}
              zoomControl={false}
              attributionControl={false}
              style={CSS_SPREAD_ABSOLUTE}
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
              <Text size="large">{building.name}</Text>
            </Box>
          </Stack>
        </Box>
      </Box>

      <PageSection
        heading="Verdiepingen"
        action={
          <TextButton>
            <Add size="small" color="currentColor" /> verdieping
          </TextButton>
        }
      />

      <Grid fill="horizontal" columns={['1/3']} rows={['small']} gap="medium">
        {Object.entries(building.buildingStoreys || {}).map(
          ([key, buildingStorey]) =>
            buildingStorey && (
              <Box
                key={key}
                direction="column"
                align="center"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  navigate([window.location.pathname, key].join('/'))
                }
              >
                <Text size="large" truncate>
                  {buildingStorey.name}
                </Text>
                {/* <Box direction="row">
                  <EditInlineStringProp subject={building} prop="name" />
                </Box> */}
              </Box>
            )
        )}
      </Grid>
    </>
  );
});

const BuildingEdit: React.FunctionComponent<{
  building: PartialBuilding;
}> = observer(({ building }) => {
  return <Text>Edit {building.name}</Text>;
});
