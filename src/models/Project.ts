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
import { OmitStrict } from 'type-zoo/types';

import { base } from './base';
import { HasManySites } from './Site';
import { singleton } from './utils';

const projectType = 'project';

// VERSION 1
const projectV1Props = {
  title: t.string,
  description: t.maybe(t.string),
  image: t.model({ prefix: t.string }),
};

const ProjectV1Model = singleton(() => t.model(projectType, projectV1Props));
type SnapshotInProjectV1 = SnapshotIn<ReturnType<typeof ProjectV1Model>>;

function isProjectV1Snapshot(obj: any): obj is SnapshotInProjectV1 {
  return !isProjectV2Snapshot(obj);
}

const toSnapshot1 = (snapshot: SnapshotInProjectV1) => snapshot;

// VERSION 2
const ProjectV2Model = singleton(() =>
  t.model(
    projectType,
    ((v1: typeof projectV1Props) => {
      // change: v2 allows for multple images, v1 only 1
      const v2 = {
        ...v1,
        type: t.optional(
          t.refinement(t.string, v => v === projectType),
          projectType
        ),
        version: t.optional(t.refinement(t.number, v => v === 2), 2),
        images: t.array(projectV1Props.image),
      };

      delete v2.image;
      return v2 as OmitStrict<typeof v2, 'image'>; // help typescript
    })(projectV1Props)
  )
);
type SnapshotInProjectV2 = SnapshotIn<ReturnType<typeof ProjectV2Model>>;

function isProjectV2Snapshot(obj: any): obj is SnapshotInProjectV2 {
  return /*!isProjectV3Snapshot(obj) &&*/ Array.isArray(obj.images);
}

const toSnapshot2: (
  snapshot: SnapshotInProjectV1 | SnapshotInProjectV2
) => SnapshotInProjectV2 = snapshot =>
  isProjectV1Snapshot(snapshot)
    ? {
        ...toSnapshot1(snapshot),
        images: [snapshot.image],
      }
    : snapshot;

// GENERAL IMPLEMENTATION

export const Project = singleton(() =>
  t
    .compose(
      'Project',
      base(),
      ProjectV2Model(),
      HasManySites()
    )
    .preProcessSnapshot(toSnapshot2 as any)
    .actions(self => ({
      setTitle(title: string) {
        self.title = title;
      },
      setDescription(description: string | null | undefined) {
        self.description = description == null ? undefined : description;
      },
    }))
);

type ProjectType = ReturnType<typeof Project>;
export type TProjectInstance = Instance<ProjectType>;
export type TProjectSnapshotIn = SnapshotIn<ProjectType>;
export type TProjectSnapshotOut = SnapshotOut<ProjectType>;
export type TProject = TProjectSnapshotIn | TProjectInstance;

export interface IProject extends TProjectInstance {}

export const isProject = (obj: IStateTreeNode): obj is TProjectInstance =>
  isStateTreeNode(obj) && (obj as any).type === projectType;

export const BelongsToProject = singleton(() =>
  t
    .model('BelongsToProject', { projectId: t.maybe(t.string) })
    .views(self => ({
      get project(): IProject | undefined | null {
        return self.projectId && getEnv(self).load(Project, self.projectId);
      },
    }))
    .actions(self => ({
      setProject(project?: IProject) {
        self.projectId = project && getIdentifier(project)!;
      },
    }))
);
