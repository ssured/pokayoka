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

export const projectType = 'project';
export const Project = base(projectType)
  .props({
    name: t.string,
    plans: t.optional(t.map(PlanRef), () => ({})),
  })
  .views(self => ({
    get currentPlans(): IPlan[] {
      return [...self.plans.values()].filter(plan => plan != null) as IPlan[];
    },
  }))
  .actions(self => {
    return {
      setName(name: string) {
        self.name = name;
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
  });

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

const _BasicForm: React.SFC<{ project: IProject }> = ({ project }) => (
  <div className="container">
    <h3>Edit project {project.name}</h3>
    <Formik
      initialValues={getSnapshot(project)}
      onSubmit={(
        values: IProjectIn,
        { setSubmitting }: FormikActions<IProjectIn>
      ) => {
        project.setName(values.name);
        setSubmitting(false);
      }}
      render={() => (
        <Form>
          <label htmlFor="name">Project naam</label>
          <Field
            id="name"
            name="name"
            placeholder="Vul hier een naam in"
            type="text"
          />

          <button type="submit" style={{ display: 'block' }}>
            Submit
          </button>
        </Form>
      )}
    />
  </div>
);

export const BasicForm = observer(_BasicForm);
