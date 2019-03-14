import {
  Instance,
  isStateTreeNode,
  IStateTreeNode,
  SnapshotIn,
  SnapshotOut,
  types,
} from 'mobx-state-tree';
import { referenceTo } from '../graph/index';
import { IFCSpatialStructureElement } from './IFC';
import { Site } from './Site';
import { postalAddress } from './types';
import { singleton } from './utils';

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
    .actions(self => ({}))
);

export const isBuilding = (obj: IStateTreeNode): obj is TBuildingInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export type TBuilding = ReturnType<typeof Building>;
export type TBuildingInstance = Instance<TBuilding>;
export type TBuildingSnapshotIn = SnapshotIn<TBuilding>;
export type TBuildingSnapshotOut = SnapshotOut<TBuilding>;
export interface IBuilding extends TBuildingInstance {}
