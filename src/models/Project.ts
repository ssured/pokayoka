import {
  types as t,
  SnapshotIn,
  Instance,
  SnapshotOut,
  IStateTreeNode,
  isStateTreeNode,
  getEnv,
  getIdentifier,
} from 'mobx-state-tree';

import { singleton, nameFromType, Env } from './utils';
import { IFCObject } from './IFC';
import { label } from './types';

import { Maybe, Result } from 'true-myth';
import { lookupInverse } from '../graph/index';
import { Site } from './Site';
const { just, nothing } = Maybe;

const type = 'project';

export const Project = singleton(() =>
  t
    .compose(
      nameFromType(type),
      IFCObject(),
      t.model({
        type,
        typeVersion: 1,
        longName: t.maybe(label), // Long name for the project as used for reference purposes.
        phase: t.maybe(label), // Current project phase, open to interpretation for all project partner, therefore given as IfcString.
      })
    )
    .views(self => ({
      get sites() {
        return lookupInverse(getEnv(self), self.id, Site(), 'project');
      },
    }))
    .actions(self => ({}))
);

export const isProject = (obj: IStateTreeNode): obj is TProjectInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export const BelongsToProject = singleton(() =>
  t
    .model('BelongsToProject', { projectId: t.maybe(t.string) })
    .views(self => ({
      get project(): Maybe<Result<Maybe<IProject>, string>> {
        if (self.projectId == null) return nothing();
        return just(getEnv<Env>(self).load(Project, self.projectId));
      },
    }))
    .actions(self => ({
      setProject(project?: IProject) {
        self.projectId = project && getIdentifier(project)!;
      },
    }))
);

export type TProject = ReturnType<typeof Project>;
export type TProjectInstance = Instance<TProject>;
export type TProjectSnapshotIn = SnapshotIn<TProject>;
export type TProjectSnapshotOut = SnapshotOut<TProject>;
export interface IProject extends TProjectInstance {}
