/**
 * This component scaffolds a new project with site, building and storeys
 */

import { Formik } from 'formik';
import { Box, Button, Grid } from 'grommet';
import { Save } from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import * as yup from 'yup';
import { useRoot } from '../../contexts/spo-hub';
import { TextField } from '../../form/TextField';
import { PageTitle } from '../../layout/PageTitle';
import { isPProject, newPProject } from '../../model/Project/model';
import { isPSite, newPSite } from '../../model/Site/model';
import { newPBuilding, isPBuilding } from '../../model/Building/model';

type NewProjectScaffold = {
  project: Parameters<typeof newPProject>[0];
  site: Parameters<typeof newPSite>[0];
  building: Parameters<typeof newPBuilding>[0];
};

const validationSchema = yup.object({
  project: yup.object({
    name: yup.string().required(),
    code: yup.string(),
  }),
  site: yup.object({
    name: yup.string().required(),
  }),
  building: yup.object({
    name: yup.string(),
  }),
});

export const New: React.FunctionComponent<{
  afterCreate: (project: PProject) => void;
}> = observer(({ afterCreate }) => {
  const [submitted, setSubmitted] = useState(false);
  const user = useRoot()();

  const initialValues: NewProjectScaffold = {
    project: {
      name: 'Test',
    },
    site: {
      name: 'Rolde',
    },
    building: {
      name: '',
    },
  };

  return (
    <>
      <PageTitle>Nieuw project aanmaken</PageTitle>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        validateOnBlur={submitted}
        validateOnChange={submitted}
        onSubmit={async (values, helpers) => {
          try {
            if (!user.projects) {
              debugger;
              user.projects = {};
            }
            // await when(() => !!ifExists(user.projects));

            const newProject = newPProject(values.project);
            user.projects[newProject.identifier] = newProject;

            const project = user.projects[newProject.identifier];
            if (!isPProject(project)) {
              throw new Error('Could not create Project');
            }

            const newSite = newPSite({ ...values.site });
            project.sites[newSite.identifier] = newSite;

            const site = project.sites[newSite.identifier];
            if (!isPSite(site)) {
              throw new Error('Could not create Site');
            }

            const newBuilding = newPBuilding({
              ...values.building,
              name: values.building.name || project.name,
            });
            site.buildings[newBuilding.identifier] = newBuilding;

            const building = site.buildings[newBuilding.identifier];
            if (!isPBuilding(building)) {
              throw new Error('Could not create Building');
            }

            afterCreate(project);
          } catch (e) {
            console.error(e);
            throw e;
          } finally {
            helpers.setSubmitting(false);
          }
        }}
        render={({ handleSubmit, isSubmitting }) => (
          <form
            onSubmit={e => {
              e.preventDefault();
              setSubmitted(true);
              handleSubmit();
            }}
          >
            <Grid
              fill
              rows={['auto', 'flex', 'auto']}
              columns={['flex', 'auto']}
              areas={[
                { name: 'above', start: [0, 0], end: [1, 0] },
                { name: 'form', start: [0, 1], end: [0, 1] },
                { name: 'right', start: [1, 1], end: [1, 1] },
                { name: 'below', start: [0, 2], end: [0, 2] },
              ]}
              gap="medium"
            >
              <Box gridArea="form">
                {/* <TextField label="Type" name="@type" />
                <TextField label="ID" name="identifier" /> */}
                <TextField label="Projectnaam" name="project.name" required />
                <TextField label="Projectcode" name="project.code" />
                <TextField
                  label="Gebouw naam"
                  name="building.name"
                  placeholder="Alleen invullen als anders dan projectnaam"
                />
                <TextField label="Plaatsnaam" name="site.name" required />
              </Box>
              <Box justify="end" direction="row" gap="medium" gridArea="below">
                <Button
                  label="Annuleren"
                  onClick={() => window.history.back()}
                  disabled={isSubmitting}
                />
                <Button
                  primary
                  type="submit"
                  icon={<Save />}
                  label="Opslaan"
                  disabled={isSubmitting}
                />
              </Box>
            </Grid>
          </form>
        )}
      />
    </>
  );
});