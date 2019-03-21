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
import {
  SpatialStructureElement,
  projectIdFromSpatialStructure,
} from './union';

export const sheetType: 'sheet' = 'sheet';

const POSTFIX = '|png';

export const Sheet = singleton(() => {
  return types
    .model(sheetType, {
      id: types.identifier,
      type: sheetType,
      typeVersion: 1,

      width: types.number,
      height: types.number,
      availableZoomLevels: types.string, // JSON string of array of numbers
      prefix: types.string,

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
    .views(self => ({
      get projectId() {
        return projectIdFromSpatialStructure(self.spatialStructure.maybe);
      },
    }))
    .views(self => ({
      urlFor(z: number, x: number, y: number) {
        const key = [self.prefix, z, x, y + POSTFIX].join('/');
        const file = self.tiles.get(key);
        if (file && self.projectId) {
          return file.src(self.projectId);
        }
        return undefined;
      },
    }))
    .actions(self => ({}));
});

export const isSheet = (obj: IStateTreeNode): obj is TSheetInstance =>
  isStateTreeNode(obj) && (obj as any).type === sheetType;

export type TSheet = ReturnType<typeof Sheet>;
export type TSheetInstance = Instance<TSheet>;
export type TSheetSnapshotIn = SnapshotIn<TSheet>;
export type TSheetSnapshotOut = SnapshotOut<TSheet>;
export interface ISheet extends TSheetInstance {}
