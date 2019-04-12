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
import { PartialSite } from '../../model/Site/model';
import { subj } from '../../utils/spo';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { BuildingPage } from './BuildingPage';

export const SitePage: React.FunctionComponent<
  RouteComponentProps<{ siteKey: string }> & { projectCode: string }
> = observer(({ projectCode, siteKey }) => {
  const { get } = useContext(SPOContext);
  const q = useQuery(v => [{ s: v('s'), p: 'code', o: projectCode }]);

  // console.log(`query:${JSON.stringify(q, null, 2)}`);

  const site =
    q.length === 1
      ? (get(
          (q[0].variables.s as subj).concat('sites', siteKey!)
        ) as PartialSite)
      : undefined;

  if (site) {
    return (
      <PageTitle title={site.name} href={`./${siteKey}`}>
        <Router>
          <SiteFrame path="/" {...{ site }} />
          <BuildingPage
            path="/:buildingKey/*"
            {...{ projectCode, siteKey: siteKey! }}
          />
        </Router>
      </PageTitle>
    );
  }

  return <div>Loading site</div>;
});

const SiteFrame: React.FunctionComponent<
  RouteComponentProps<{}> & {
    site: PartialSite;
  }
> = ({ site }) => {
  const [showEdit, toggleEdit] = useToggle(false);

  return (
    <Page
      rightOfTitle={
        <TextButton
          label={showEdit ? 'verwijder locatie' : 'wijzig locatie'}
          onClick={() => toggleEdit()}
        />
      }
    >
      {showEdit ? <SiteEdit site={site} /> : <SiteShow site={site} />}
    </Page>
  );
};

const SiteShow: React.FunctionComponent<{
  site: PartialSite;
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

      <Grid columns={['1/3']} rows={['small']} gap="medium">
        {Object.entries(site.buildings || {}).map(
          ([key, building]) =>
            building && (
              <Box
                key={key}
                direction="column"
                align="center"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  navigate([window.location.pathname, key].join('/'))
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

const SiteEdit: React.FunctionComponent<{
  site: PartialSite;
}> = observer(({ site }) => {
  return <Text>Edit {site.name}</Text>;
});
