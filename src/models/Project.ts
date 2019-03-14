import {
  getEnv,
  Instance,
  isStateTreeNode,
  IStateTreeNode,
  SnapshotIn,
  SnapshotOut,
  types,
} from 'mobx-state-tree';
import { ObservableAsyncPlaceholder } from '../graph/asyncPlaceholder';
import { lookupInverse } from '../graph/index';
import { IFCObject } from './IFC';
import { ISite, Site } from './Site';
import { label } from './types';
import { singleton } from './utils';

const type = 'project';

export const Project = singleton(() =>
  types
    .compose(
      type,
      IFCObject(),
      types.model({
        type,
        typeVersion: 1,

        /**
         * Long name for the project as used for reference purposes.
         */
        longName: types.maybe(label),

        /**
         * Current project phase, open to interpretation for all project partner, therefore given as IfcString.
         */
        phase: types.maybe(label),
      })
    )
    .views(self => ({
      /**
       * Sites for this project
       */
      get sites(): ObservableAsyncPlaceholder<ISite[]> {
        return lookupInverse(getEnv(self), self.id, Site(), 'project');
      },
    }))
    .actions(self => ({}))
);

export const isProject = (obj: IStateTreeNode): obj is TProjectInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export type TProject = ReturnType<typeof Project>;
export type TProjectInstance = Instance<TProject>;
export type TProjectSnapshotIn = SnapshotIn<TProject>;
export type TProjectSnapshotOut = SnapshotOut<TProject>;
export interface IProject extends TProjectInstance {}
