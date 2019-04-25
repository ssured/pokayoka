import {
  Box,
  Button,
  Grid,
  Image,
  ResponsiveContext,
  Stack,
  Text,
} from 'grommet';
import { Add, Image as ImageIcon, Trash } from 'grommet-icons';
import { filter, groupBy } from 'lodash';
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { Map, Marker, TileLayer } from 'react-leaflet';
import { EditInlineStringProp } from '../../../../components/EditInlineStringProp';
import { PageSection } from '../../../../components/Page/PageSection';
import { TextButton } from '../../../../components/TextButton';
import { RoutedButton } from '../../../../layout/RoutedButton';
import { Todo } from '../../../../layout/Todo';
import { router } from '../../../../router';
import { Maybe } from '../../../../utils/universe';

export const ProjectSettings: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  const size = useContext(ResponsiveContext);
  return (
    <>
      <Box direction="row" justify="between">
        <Box>
          <Grid columns={['flex', 'auto']} gap="medium">
            <EditInlineStringProp subject={project} prop="name" />
            <EditInlineStringProp
              subject={project}
              prop="code"
              placeholder="Projectcode"
            />
          </Grid>
        </Box>
        <Grid columns={['flex', 'auto']} gap="medium" align="end" justify="end">
          <EditInlineStringProp
            subject={project}
            prop="$image"
            rtl
            show={value =>
              value ? (
                <Box width="small" height="small">
                  <Image src={`/cdn/${value}`} fit="cover" />
                </Box>
              ) : (
                <ImageIcon />
              )
            }
          />
        </Grid>
      </Box>

      <PageSection
        heading="Contactpersonen"
        action={
          <RoutedButton
            to={router.projects.projectId.settings.addContact}
            label={
              <Text color="blue">
                <Add size="small" color="currentColor" /> contactpersoon
              </Text>
            }
          />
        }
      />

      <Grid
        align="start"
        columns={
          size === 'small' ? undefined : { count: 'fill', size: 'small' }
        }
        gap="medium"
      >
        {Object.entries(
          groupBy(
            filter(project.roles, role => !!role.roleName),
            role => role.roleName
          )
        ).map(([roleName, roles]) => (
          <Box key={roleName} direction="column">
            <Text weight="bold">{roleName}</Text>
            <Box as="ul" margin={{ left: 'medium' }}>
              {roles.map((role, i) => (
                <Text key={i} as="li">
                  {role.member && (
                    <>
                      {role.member.givenName} {role.member.additionalName}{' '}
                      {role.member.familyName}
                    </>
                  )}
                  <Todo>
                    <Button
                      plain
                      icon={<Trash color="blue" />}
                      onClick={() =>
                        (project.roles[role.identifier!] = null as any)
                      }
                    />
                  </Todo>
                </Text>
              ))}
            </Box>
          </Box>
        ))}
      </Grid>

      <PageSection
        heading="Locaties"
        action={
          <TextButton>
            <Add size="small" color="currentColor" /> locatie
          </TextButton>
        }
      />

      <Grid
        fill="horizontal"
        columns={['medium']}
        rows={['small']}
        gap="medium"
      >
        {Object.entries(project.sites || {}).map(
          ([key, site]) =>
            site && (
              <Box
                key={key}
                direction="column"
                align="center"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  router.projects.projectId.settings.siteId.$push({
                    siteId: site.identifier,
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
                    <Text size="large">{site.name}</Text>
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
