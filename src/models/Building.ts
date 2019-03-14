import {
  Instance,
  isStateTreeNode,
  IStateTreeNode,
  SnapshotIn,
  SnapshotOut,
  types,
  getEnv,
} from 'mobx-state-tree';
import { referenceTo, lookupInverse } from '../graph/index';
import { IFCSpatialStructureElement } from './IFC';
import { Site } from './Site';
import { postalAddress } from './types';
import { singleton } from './utils';
import { ObservableAsyncPlaceholder } from '../graph/asyncPlaceholder';
import { IBuildingStorey, BuildingStorey } from './BuildingStorey';

const type = 'building';

export const Building = singleton(() =>
  types
    .compose(
      type,
      IFCSpatialStructureElement(),
      types.model({
        type,
        typeVersion: 1,
        elevationOfRefHeight: types.maybe(types.number),
        elevationOfTerrain: types.maybe(types.number),
        buildingAddress: types.maybe(postalAddress),
        site: referenceTo(Site()),
      })
    )
    .views(self => ({
      /**
       * BuildingStoreys for this building
       */
      get storeys(): ObservableAsyncPlaceholder<IBuildingStorey[]> {
        return lookupInverse(
          getEnv(self),
          self.id,
          BuildingStorey(),
          'building'
        );
      },
    }))
    .actions(self => ({}))
);

export const isBuilding = (obj: IStateTreeNode): obj is TBuildingInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export type TBuilding = ReturnType<typeof Building>;
export type TBuildingInstance = Instance<TBuilding>;
export type TBuildingSnapshotIn = SnapshotIn<TBuilding>;
export type TBuildingSnapshotOut = SnapshotOut<TBuilding>;
export interface IBuilding extends TBuildingInstance {}
