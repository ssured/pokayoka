import React from 'react';
import { Formik, Field, Form, FormikActions } from 'formik';
import { Omit } from 'type-zoo';
import { observer } from 'mobx-react-lite';

import {
  types as t,
  Instance,
  SnapshotIn,
  SnapshotOut,
  IStateTreeNode,
  isStateTreeNode,
  getSnapshot,
  getRoot,
} from 'mobx-state-tree';

import { base, referenceHandler } from './base';

import { Plan, PlanRef, IPlan } from './Plan';
import { generateId } from '../utils/id';

import styled from 'styled-components';

export const projectType = 'project';
export const Project = base(projectType)
  .props({
    title: t.string,
    description: t.maybe(t.string),
    plans: t.optional(t.map(PlanRef), () => ({})),
  })
  .views(self => ({
    get currentPlans(): IPlan[] {
      return [...self.plans.values()].filter(plan => plan != null) as IPlan[];
    },
  }))
  .actions(self => {
    return {
      setTitle(title: string) {
        self.title = title;
      },
      addPlan() {
        const plan = Plan.create({
          _id: generateId(),
          name: `plan ${Date.now()}`,
        });

        const id = (getRoot(self) as any).add(plan) as string | null;

        if (id) {
          self.plans.set(id, id);
        }
      },
      removePlan(plan: IPlan) {
        if (self.plans.has(plan._id)) {
          self.plans.delete(plan._id);
        }
      },
    };
  })
  .actions(self => ({
    // afterCreate() {
    //   setInterval(() => {
    //     const [title, index] = self.title.split('|');
    //     self.setName([title, (index ? parseInt(index, 10) : 0) + 1].join('|'));
    //   }, 50);
    // },
  }));

export type TProjectInstance = Instance<typeof Project>;
export type TProjectSnapshotIn = SnapshotIn<typeof Project>;
export type TProjectSnapshotOut = SnapshotOut<typeof Project>;
export type TProject = TProjectSnapshotIn | TProjectInstance;

export interface IProject extends TProjectInstance {}
export interface IProjectIn
  extends Omit<TProjectSnapshotIn, '_id' | '_rev' | 'type' | '#'> {}

export const isProject = (obj: IStateTreeNode): obj is TProjectInstance =>
  isStateTreeNode(obj) && (obj as any).type === projectType;

export const ProjectRef = t.reference(Project, referenceHandler);

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
        values: IProjectIn,
        { setSubmitting }: FormikActions<IProjectIn>
      ) => {
        project.setTitle(values.title);
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

export const BasicForm = observer(_BasicForm);
