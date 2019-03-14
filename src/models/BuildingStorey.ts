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
import { Building } from './Building';
import { IFCSpatialStructureElement } from './IFC';
import { singleton } from './utils';
import { ObservableAsyncPlaceholder } from '../graph/asyncPlaceholder';
import { ISpace, Space } from './Space';

const type = 'buildingStorey';

export const BuildingStorey = singleton(() =>
  types
    .compose(
      type,
      IFCSpatialStructureElement(),
      types.model({
        type,
        typeVersion: 1,
        elevation: types.maybe(types.number),
        building: referenceTo(Building()),
      })
    )
    .views(self => ({
      /**
       * Spaces for this buildingStorey
       */
      get spaces(): ObservableAsyncPlaceholder<ISpace[]> {
        return lookupInverse(getEnv(self), self.id, Space(), 'buildingStorey');
      },
    }))
    .actions(self => ({}))
);

export const isBuildingStorey = (
  obj: IStateTreeNode
): obj is TBuildingStoreyInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export type TBuildingStorey = ReturnType<typeof BuildingStorey>;
export type TBuildingStoreyInstance = Instance<TBuildingStorey>;
export type TBuildingStoreySnapshotIn = SnapshotIn<TBuildingStorey>;
export type TBuildingStoreySnapshotOut = SnapshotOut<TBuildingStorey>;
export interface IBuildingStorey extends TBuildingStoreyInstance {}
