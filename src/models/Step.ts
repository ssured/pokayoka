import {
  types as t,
  Instance,
  SnapshotIn,
  SnapshotOut,
  IStateTreeNode,
  isStateTreeNode,
} from 'mobx-state-tree';
import { base, referenceHandler } from './base';
import { ImageRef } from './Image';

const identifier = t.optional(t.identifier, () =>
  Math.random()
    .toString(36)
    .substr(2)
);

const Step_Image = t.model({
  id: identifier,
  sortIndex: t.optional(t.number, () => Date.now()),

  image: ImageRef,
});

const Step_Step_Annotation = t.model({
  id: identifier,
  sortIndex: t.optional(t.number, () => Date.now()),

  image: ImageRef,
  geoJson: t.frozen(),
});

const Step_Step = t
  .model({
    id: identifier,
    sortIndex: t.optional(t.number, () => Date.now()),

    markdown: t.string,
    color: t.maybe(t.string),
    annotations_: t.map(Step_Step_Annotation),
  })
  .views(self => ({
    get annotations() {
      return Array.from(self.annotations_.values()).sort(
        ({ sortIndex: a }, { sortIndex: b }) => b - a
      );
    },
  }));

export const stepType = 'step';
export const Step = base(stepType)
  .props({
    title: t.string,
    images_: t.map(Step_Image),
    steps_: t.map(Step_Step),
  })
  // .preProcessSnapshot(snapshot => ({...snapshot}))
  .views(self => {
    return {
      get images() {
        return Array.from(self.images_.values()).sort(
          ({ sortIndex: a }, { sortIndex: b }) => b - a
        );
      },
      get steps() {
        return Array.from(self.steps_.values()).sort(
          ({ sortIndex: a }, { sortIndex: b }) => b - a
        );
      },
    };
  });

// --- hygen generated code

export const StepRef = t.reference(Step, referenceHandler);
export const isStep = (obj: IStateTreeNode): obj is TStepInstance =>
  isStateTreeNode(obj) && (obj as any).type === stepType;

export type TStepInstance = Instance<typeof Step>;
export type TStepSnapshotIn = SnapshotIn<typeof Step>;
export type TStepSnapshotOut = SnapshotOut<typeof Step>;
export type TStep = TStepInstance | TStepSnapshotIn;

export interface IStep extends TStepInstance {}
export interface IStepSnapshotIn extends TStepSnapshotIn {}
export interface IStepSnapshotOut extends TStepSnapshotOut {}
