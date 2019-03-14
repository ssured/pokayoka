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
import { BuildingStorey, TBuildingStorey } from './BuildingStorey';
import { IFCObject } from './IFC';
import { singleton } from './utils';
import { Site, TSite } from './Site';
import { Building, TBuilding } from './Building';

const type: 'sheet' = 'sheet';

export const Sheet = singleton(() => {
  const SiteOrBuildingOrBuildingStorey = types.union(
    {
      eager: true,
      dispatcher: snapshot => {
        switch (snapshot.type) {
          case Site().name:
            return Site();
          case Building().name:
            return Building();
          case BuildingStorey().name:
            return BuildingStorey();
        }
        throw new Error(`No valid type found for ${snapshot.type}`);
      },
    },
    Site(),
    Building(),
    BuildingStorey()
  ) as TSite | TBuilding | TBuildingStorey;

  return types
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
         * The object for which this is a sheet
         * Can be a Site, Building or BuildingStorey
         */
        forObject: referenceTo(SiteOrBuildingOrBuildingStorey),
      })
    )
    .actions(self => ({}));
});

export const isSheet = (obj: IStateTreeNode): obj is TSheetInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export type TSheet = ReturnType<typeof Sheet>;
export type TSheetInstance = Instance<TSheet>;
export type TSheetSnapshotIn = SnapshotIn<TSheet>;
export type TSheetSnapshotOut = SnapshotOut<TSheet>;
export interface ISheet extends TSheetInstance {}
