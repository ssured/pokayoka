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
import { BuildingStorey } from './BuildingStorey';
import { IFCObject } from './IFC';
import { singleton } from './utils';

const type = 'sheet';

export const Sheet = singleton(() =>
  types
    .compose(
      type,
      IFCObject(),
      types.model({
        type,
        typeVersion: 1,

        /**
         * Map of files, where the key encodes the position of the
         */
        tiles: types.map(File()),

        /**
         * The building storey of which this is the sheet
         * Can be empty
         */
        buildingStorey: types.maybe(referenceTo(BuildingStorey())),
      })
    )
    .actions(self => ({}))
);

export const isSheet = (obj: IStateTreeNode): obj is TSheetInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export type TSheet = ReturnType<typeof Sheet>;
export type TSheetInstance = Instance<TSheet>;
export type TSheetSnapshotIn = SnapshotIn<TSheet>;
export type TSheetSnapshotOut = SnapshotOut<TSheet>;
export interface ISheet extends TSheetInstance {}
