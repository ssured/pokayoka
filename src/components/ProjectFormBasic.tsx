import React from 'react';
import { Formik, FormikActions } from 'formik';
import { observer } from 'mobx-react-lite';

import { IProject, TProjectSnapshotIn } from '../models/Project';

import styled from 'styled-components';
import { getSnapshot } from 'mobx-state-tree';

const SForm = styled('form')`
  border: 2px solid red;
  display: grid;
  grid-template-columns: 1fr 1em 3fr;
  grid-gap: 0.3em 0.6em;
  grid-auto-flow: dense;
  align-items: center;

  input,
  output,
  textarea,
  select,
  button {
    grid-column: 2 / 4;
    width: auto;
    margin: 0;
  }

  input[type='checkbox'],
  input[type='radio'] {
    grid-column: 1 / 3;
    justify-self: end;
    margin: 0;
  }

  label,
  input[type='checkbox'] + label,
  input[type='radio'] + label {
    width: auto;
    padding: 0;
    margin: 0;
  }

  textarea + label {
    align-self: start;
  }
`;

const _BasicForm: React.SFC<{ project: IProject }> = ({ project }) => (
  <div className="container">
    <h3>Edit project {project.title}</h3>
    <Formik
      initialValues={getSnapshot(project)}
      onSubmit={(
        values: TProjectSnapshotIn,
        { setSubmitting }: FormikActions<TProjectSnapshotIn>
      ) => {
        project.setTitle(values.title);
        project.setDescription(values.description);
        setSubmitting(false);
      }}
      render={({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmitting,
      }) => (
        <SForm onSubmit={handleSubmit}>
          <label>Project naam</label>
          <input
            type="text"
            name="title"
            placeholder="Vul hier een naam in van het project"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.title}
          />
          {errors.title && touched.title && errors.title}

          <label htmlFor="description">Beschrijving</label>
          <textarea
            name="description"
            placeholder="Korte omschrijving"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.description}
            rows={10}
          />
          {errors.description && touched.description && errors.description}

          <button type="submit" disabled={isSubmitting}>
            Submit
          </button>
        </SForm>
      )}
    />
  </div>
);

export const ProjectFormBasic = observer(_BasicForm);
