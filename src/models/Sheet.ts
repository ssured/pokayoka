import {
  Instance,
  isStateTreeNode,
  IStateTreeNode,
  SnapshotIn,
  SnapshotOut,
  types,
} from 'mobx-state-tree';
import { referenceTo } from '../graph/index';
import { File } from './base';
import { singleton } from './utils';
import { SpatialStructureElement } from './union';

export const sheetType: 'sheet' = 'sheet';

export const Sheet = singleton(() => {
  return types
    .model(sheetType, {
      id: types.identifier,
      type: sheetType,
      typeVersion: 1,

      /**
       * Map of files, where the key encodes the position of the
       */
      tiles: types.map(File()),

      /**
       * The object for which this is a sheet
       * Can be a Site, Building or BuildingStorey
       */
      spatialStructure: referenceTo(SpatialStructureElement()),
    })
    .actions(self => ({}));
});

export const isSheet = (obj: IStateTreeNode): obj is TSheetInstance =>
  isStateTreeNode(obj) && (obj as any).type === sheetType;

export type TSheet = ReturnType<typeof Sheet>;
export type TSheetInstance = Instance<TSheet>;
export type TSheetSnapshotIn = SnapshotIn<TSheet>;
export type TSheetSnapshotOut = SnapshotOut<TSheet>;
export interface ISheet extends TSheetInstance {}
