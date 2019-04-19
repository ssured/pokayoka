import { navigate, RouteComponentProps, Router } from '@reach/router';
import {
  Box,
  Grid,
  Image,
  ResponsiveContext,
  Stack,
  Text,
  Button,
} from 'grommet';
import { Add, Image as ImageIcon, Trash } from 'grommet-icons';
import { groupBy, filter } from 'lodash';
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { Map, Marker, TileLayer } from 'react-leaflet';
import { useToggle } from 'react-use';
import { EditInlineStringProp } from '../../components/EditInlineStringProp';
import { Page, PageTitle } from '../../components/Page/Page';
import { PageSection } from '../../components/Page/PageSection';
import { TextButton } from '../../components/TextButton';
import { SPOContext, useQuery } from '../../contexts/spo-hub';
import { setSubjectMany } from '../../model/base';
import {
  PartialProject,
  projectRemoveRole,
  isPProject,
} from '../../model/Project/model';
import { subj } from '../../utils/spo';
import { AddContactPerson } from './AddContactPerson';
import { SitePage } from './SitePage';
import { isRole } from '../../model/Role';

export const ProjectPage: React.FunctionComponent<
  RouteComponentProps<{ projectCode: string }> & {}
> = observer(({ projectCode }) => {
  const { get } = useContext(SPOContext);
  const q = useQuery(v => [{ s: v('s'), p: 'code', o: projectCode }]);

  const project =
    q.length === 1
      ? (get(q[0].variables.s as subj) as PartialProject)
      : undefined;

  console.log(projectCode, JSON.stringify(q));

  if (project) {
    return (
      <PageTitle
        prefix="project"
        title={project.name}
        href={`/paged/${projectCode}`}
      >
        <Router>
          <ProjectFrame path="/" {...{ project }} />
          <AddContactPerson
            path="/add-contact"
            onSubmit={async role => {
              setSubjectMany(project, 'roles', role.identifier, role);
              navigate(`/paged/${projectCode}`);
            }}
          />
          <SitePage path="/:siteKey/*" projectCode={projectCode!} />
        </Router>
      </PageTitle>
    );
  }

  return <div>Loading project</div>;
});

const ProjectFrame: React.FunctionComponent<
  RouteComponentProps<{}> & {
    project: PartialProject;
  }
> = ({ project }) => {
  const [showEdit, toggleEdit] = useToggle(false);

  return (
    <Page
      rightOfTitle={
        <TextButton
          label={showEdit ? 'verwijder project' : 'wijzig project'}
          onClick={() => toggleEdit()}
        />
      }
    >
      {showEdit ? (
        <ProjectEdit project={project} />
      ) : (
        <ProjectShow project={project} />
      )}
    </Page>
  );
};

const ProjectShow: React.FunctionComponent<{
  project: PartialProject;
}> = observer(({ project }) => {
  const size = useContext(ResponsiveContext);
  return (
    <>
      <Box direction="row" justify="between">
        <Box>
          <Grid columns={['flex', 'auto']} gap="medium">
            <EditInlineStringProp subject={project} prop="name" />
            <EditInlineStringProp subject={project} prop="code" />
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
          <TextButton
            onClick={() =>
              navigate([window.location.pathname, 'add-contact'].join('/'))
            }
          >
            <Add size="small" color="currentColor" /> contactpersoon
          </TextButton>
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
            filter(project.roles || {}, role => !!(role && role.roleName)),
            role => role && role.roleName
          )
        ).map(([roleName, roles]) => (
          <Box key={roleName} direction="column">
            <Text weight="bold">{roleName}</Text>
            <Box as="ul" margin={{ left: 'medium' }}>
              {roles.map((role, i) => (
                <Text key={i} as="li">
                  {role && role.member && role.member.familyName}
                  {isRole(role) && isPProject(project) && (
                    <Button
                      plain
                      icon={<Trash color="blue" />}
                      onClick={() => projectRemoveRole(project, role)}
                    />
                  )}
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

      <Grid fill="horizontal" columns={['1/3']} rows={['small']} gap="medium">
        {Object.entries(project.sites || {}).map(
          ([key, site]) =>
            site && (
              <Box
                key={key}
                direction="column"
                align="center"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/paged/${project.code!}/${key}`)}
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

const ProjectEdit: React.FunctionComponent<{
  project: PartialProject;
}> = observer(({ project }) => {
  return <Text>Edit {project.name}</Text>;
});
