import {
  types as t,
  Instance,
  SnapshotIn,
  SnapshotOut,
  IStateTreeNode,
  isStateTreeNode,
  getParent,
} from 'mobx-state-tree';
import { base, referenceHandler } from './base';
import { ImageRef } from './Image';

const identifier = t.optional(t.identifier, () =>
  Math.random()
    .toString(36)
    .substr(2)
);

const StepImage = t.model({
  id: identifier,
  sortIndex: t.optional(t.number, () => Date.now()),

  image: ImageRef,
});

const StepBulletAnnotation = t.model({
  id: identifier,
  image: ImageRef,
  geoJson: t.frozen(),
});

export const StepBullet = t
  .model({
    id: identifier,
    sortIndex: t.optional(t.number, () => Date.now()),

    markdown: t.string,
    color: t.maybe(t.string),
    annotations_: t.map(StepBulletAnnotation),
  })
  .views(self => ({
    get step() {
      return getParent<TStepInstance>(self, 2);
    },
    get annotations() {
      return Array.from(self.annotations_.values());
    },
  }))
  .actions(self => ({
    setMarkdown(markdown: string) {
      self.markdown = markdown;
    },
    setColor(color: string | undefined) {
      self.color = color;
    },
  }));

export const stepType = 'step';
export const Step = base(stepType)
  .props({
    title: t.string,
    images_: t.map(StepImage),
    bullets_: t.map(StepBullet),
  })
  .volatile(() => ({
    addedBullet: null as Instance<typeof StepBullet> | null,
    addedImage: null as Instance<typeof StepImage> | null,
  }))
  // .preProcessSnapshot(snapshot => ({...snapshot}))
  .views(self => {
    return {
      get images() {
        return Array.from(self.images_.values()).sort(
          ({ sortIndex: a }, { sortIndex: b }) => a - b
        );
      },
      get bullets() {
        return Array.from(self.bullets_.values()).sort(
          ({ sortIndex: a }, { sortIndex: b }) => a - b
        );
      },
    };
  })
  .actions(self => ({
    reorderBullets(fromIndex: number, toIndex: number) {
      const bullets = self.bullets.slice();

      const moved = bullets[fromIndex];
      if (moved == null) return;

      bullets.splice(fromIndex, 1);
      const before = bullets[toIndex - 1];
      const after = bullets[toIndex];

      if (before == null) {
        if (after == null) {
          throw new Error(`invalid reorderBullets`);
        } else {
          moved.sortIndex = after.sortIndex - 10000;
        }
      } else {
        if (after == null) {
          moved.sortIndex = Math.max(Date.now(), before.sortIndex + 10000);
        } else {
          moved.sortIndex = (before.sortIndex + after.sortIndex) / 2;
        }
      }
    },
    addBullet(atIndex: number, markdown: string = '') {
      const { bullets } = self;
      const before = bullets[atIndex - 1];
      const after = bullets[atIndex];

      let sortIndex: number;

      if (before == null) {
        if (after == null) {
          sortIndex = Date.now();
        } else {
          sortIndex = after.sortIndex - 10000;
        }
      } else {
        if (after == null) {
          sortIndex = Math.max(Date.now(), before.sortIndex + 10000);
        } else {
          sortIndex = (before.sortIndex + after.sortIndex) / 2;
        }
      }
      self.addedBullet = StepBullet.create({ sortIndex, markdown });
      self.bullets_.put(self.addedBullet);
      return self.addedBullet;
    },
    reorderImages(fromIndex: number, toIndex: number) {
      const images = self.images.slice();

      const moved = images[fromIndex];
      if (moved == null) return;

      images.splice(fromIndex, 1);
      const before = images[toIndex - 1];
      const after = images[toIndex];

      if (before == null) {
        if (after == null) {
          throw new Error(`invalid reorderImages`);
        } else {
          moved.sortIndex = after.sortIndex - 10000;
        }
      } else {
        if (after == null) {
          moved.sortIndex = Math.max(Date.now(), before.sortIndex + 10000);
        } else {
          moved.sortIndex = (before.sortIndex + after.sortIndex) / 2;
        }
      }
    },
    addImage(atIndex: number, image: string = '') {
      const { images } = self;
      const before = images[atIndex - 1];
      const after = images[atIndex];

      let sortIndex: number;

      if (before == null) {
        if (after == null) {
          sortIndex = Date.now();
        } else {
          sortIndex = after.sortIndex - 10000;
        }
      } else {
        if (after == null) {
          sortIndex = Math.max(Date.now(), before.sortIndex + 10000);
        } else {
          sortIndex = (before.sortIndex + after.sortIndex) / 2;
        }
      }
      self.addedImage = StepImage.create({ sortIndex, image });
      self.images_.put(self.addedImage);
      return self.addedImage;
    },
  }));

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
