import {
  types as t,
  Instance,
  SnapshotIn,
  SnapshotOut,
  IStateTreeNode,
  isStateTreeNode,
} from 'mobx-state-tree';
import { base, referenceHandler } from './base';

export const imageType = 'image';
export const Image = base(imageType)
  .props({
    url: t.maybe(t.string),
  })
  // .preProcessSnapshot(snapshot => ({...snapshot}))
  .views(self => {
    return {};
  });

// --- hygen generated code

export const ImageRef = t.reference(Image, referenceHandler);
export const isImage = (obj: IStateTreeNode): obj is TImageInstance =>
  isStateTreeNode(obj) && (obj as any).type === imageType;

export type TImageInstance = Instance<typeof Image>;
export type TImageSnapshotIn = SnapshotIn<typeof Image>;
export type TImageSnapshotOut = SnapshotOut<typeof Image>;
export type TImage = TImageInstance | TImageSnapshotIn;

export interface IImage extends TImageInstance {}
export interface IImageSnapshotIn extends TImageSnapshotIn {}
export interface IImageSnapshotOut extends TImageSnapshotOut {}
