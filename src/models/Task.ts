import {
  Instance,
  isStateTreeNode,
  IStateTreeNode,
  SnapshotIn,
  SnapshotOut,
  types,
  getParent,
} from 'mobx-state-tree';
import { referenceTo } from '../graph/index';
import { singleton } from './utils';
import { base } from './base';
import { Space } from './Space';
import { isNothing } from '../graph/maybe';
import { Observation } from './Observation';
import { SpatialStructureElement } from './union';

const type: 'task' = 'task';

const Asssignment = types.model({});

export const Task = singleton(() =>
  types
    .compose(
      type,
      base(),
      types.model({
        type,
        typeVersion: 1,

        /**
         * Short indicative name
         */
        name: types.string,

        /**
         * Description of what has to be accomplished
         */
        deliverable: types.maybe(types.string),

        /**
         * If the task originated from an observation, this must be the observation
         */
        basedOn: types.maybe(referenceTo(Observation())),

        /**
         * What does this task relate to?
         * Site, Building, BuildingStorey or Space
         */
        spatialStructure: referenceTo(SpatialStructureElement()),

        /**
         * The accountable person can close
         */

        labels: types.map(types.string),

        execution: types.array(
          types.model({ u: types.string, p: types.maybeNull(types.number) })
        ),
        images: types.array(
          types
            .model({
              geojson: types.frozen(),
              height: types.number,
              width: types.number,
              prefix: types.string,
            })
            .views(self => ({
              get src() {
                const task = getParent<ITask>(self, 2);

                const projectId =
                  task.parent.maybe.buildingStorey.maybe.building.maybe.site
                    .maybe.project.id;
                if (isNothing(projectId)) return '';

                const files = [...task.files.values()];
                const file = files.find(file => file.name === self.prefix);
                return `/cdn/${projectId}/${file && file.sha256}`;
              },
            }))
        ),
        parent: referenceTo(Space()),
        position: types.maybe(
          types.model({
            lat: types.number,
            lng: types.number,
            zoom: types.maybeNull(types.number),
          })
        ),
      })
    )
    .views(self => ({}))
    .actions(self => ({}))
);

export const isTask = (obj: IStateTreeNode): obj is TTaskInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export type TTask = ReturnType<typeof Task>;
export type TTaskInstance = Instance<TTask>;
export type TTaskSnapshotIn = SnapshotIn<TTask>;
export type TTaskSnapshotOut = SnapshotOut<TTask>;
export interface ITask extends TTaskInstance {}
