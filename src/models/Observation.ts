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

const type: 'observation' = 'observation';

export const Observation = singleton(() =>
  types
    .compose(
      type,
      base(),
      types.model({
        type,
        typeVersion: 1,
        title: types.maybe(types.string),
        description: types.maybe(types.string),
        execution: types.array(
          types.model({ u: types.string, p: types.maybeNull(types.number) })
        ),
        labels: types.array(types.string),
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
                const observation = getParent<IObservation>(self, 2);

                const projectId =
                  observation.parent.maybe.buildingStorey.maybe.building.maybe
                    .site.maybe.project.id;
                if (isNothing(projectId)) return '';

                const files = [...observation.files.values()];
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

export const isObservation = (
  obj: IStateTreeNode
): obj is TObservationInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export type TObservation = ReturnType<typeof Observation>;
export type TObservationInstance = Instance<TObservation>;
export type TObservationSnapshotIn = SnapshotIn<TObservation>;
export type TObservationSnapshotOut = SnapshotOut<TObservation>;
export interface IObservation extends TObservationInstance {}
