import {
  Instance,
  isStateTreeNode,
  IStateTreeNode,
  SnapshotIn,
  SnapshotOut,
  types,
  getParent,
  getEnv,
} from 'mobx-state-tree';
import { referenceTo, lookupInverse } from '../graph/index';
import { singleton } from './utils';
import { base } from './base';
import {
  SpatialStructureElement,
  projectIdFromSpatialStructure,
} from './union';
import { Sheet } from './Sheet';
import { ObservableAsyncPlaceholder } from '../graph/asyncPlaceholder';
import { ITask, Task } from './Task';

export const observationType: 'observation' = 'observation';

export const Observation = singleton(() =>
  types
    .compose(
      observationType,
      base(),
      types.model({
        type: observationType,
        typeVersion: 1,
        title: types.string,
        description: types.maybe(types.string),
        labels: types.map(types.string),
        images: types.map(
          types
            .model({
              geojson: types.frozen(),
              fileInfo: types.frozen(),
              height: types.number,
              width: types.number,
              prefix: types.string,
            })
            .views(self => ({
              get src() {
                const observation = getParent<IObservation>(self, 2);

                const projectId = projectIdFromSpatialStructure(
                  observation.spatialStructure.maybe
                );
                if (projectId == null) return '';

                const files = [...observation.files.values()];
                const file = files.find(file => file.name === self.prefix);
                return `/cdn/${projectId}/${file && file.sha256}`;
              },
            }))
        ),
        /**
         * The object for which this is a sheet
         * Can be a Site, Building or BuildingStorey
         */
        spatialStructure: referenceTo(SpatialStructureElement()),

        position: types.maybe(
          types.model({
            sheet: referenceTo(Sheet()),
            lat: types.number,
            lng: types.number,
            zoom: types.maybeNull(types.number),
          })
        ),
      })
    )
    .views(self => ({
      /**
       * Tasks for this Observation
       */
      get tasks(): ObservableAsyncPlaceholder<ITask[]> {
        return lookupInverse(getEnv(self), self.id, Task(), 'basedOn');
      },
    }))
    .actions(self => ({}))
);

export const isObservation = (
  obj: IStateTreeNode
): obj is TObservationInstance =>
  isStateTreeNode(obj) && (obj as any).type === observationType;

export type TObservation = ReturnType<typeof Observation>;
export type TObservationInstance = Instance<TObservation>;
export type TObservationSnapshotIn = SnapshotIn<TObservation>;
export type TObservationSnapshotOut = SnapshotOut<TObservation>;
export interface IObservation extends TObservationInstance {}
