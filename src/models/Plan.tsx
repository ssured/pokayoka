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
} from 'mobx-state-tree';
import { base } from './base';
import { referenceHandler } from '../store/utils';

export const planType = 'plan';
export const Plan = base(planType)
  .props({
    name: t.string,
  })
  // .preProcessSnapshot(snapshot => ({...snapshot}))
  .views(self => {
    return {};
  })
  .actions(self => {
    return {
      setName(name: string) {
        self.name = name;
      },
    };
  });

// --- hygen generated code

export const PlanRef = t.reference(Plan, referenceHandler);
export const isPlan = (obj: IStateTreeNode): obj is TPlanInstance =>
  isStateTreeNode(obj) && (obj as any).type === planType;

export type TPlanInstance = Instance<typeof Plan>;
export type TPlanSnapshotIn = SnapshotIn<typeof Plan>;
export type TPlanSnapshotOut = SnapshotOut<typeof Plan>;
export type TPlan = TPlanInstance | TPlanSnapshotIn;

export interface IPlan extends TPlanInstance {}
export interface IPlanSnapshotIn extends TPlanSnapshotIn {}
export interface IPlanSnapshotOut extends TPlanSnapshotOut {}
export interface IPlanIn
  extends Omit<TPlanSnapshotIn, '_id' | '_rev' | 'type' | '#'> {}

const _BasicForm: React.SFC<{ plan: IPlan }> = ({ plan }) => (
  <div className="container">
    <h3>Edit plan {plan.name}</h3>
    <Formik
      initialValues={getSnapshot(plan)}
      onSubmit={(
        values: IPlanIn,
        { setSubmitting }: FormikActions<IPlanIn>
      ) => {
        plan.setName(values.name);
        setSubmitting(false);
      }}
      render={() => (
        <Form>
          <label htmlFor="name">plan naam</label>
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
