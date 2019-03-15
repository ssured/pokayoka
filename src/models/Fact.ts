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

const type: 'fact' = 'fact';

export const Fact = singleton(() =>
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
                const fact = getParent<IFact>(self, 2);

                const projectId =
                  fact.parent.maybe.buildingStorey.maybe.building.maybe.site
                    .maybe.project.id;
                if (isNothing(projectId)) return '';

                const files = [...fact.files.values()];
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

export const isFact = (obj: IStateTreeNode): obj is TFactInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export type TFact = ReturnType<typeof Fact>;
export type TFactInstance = Instance<TFact>;
export type TFactSnapshotIn = SnapshotIn<TFact>;
export type TFactSnapshotOut = SnapshotOut<TFact>;
export interface IFact extends TFactInstance {}
