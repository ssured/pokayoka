import { Space, TSpace, ISpace } from './Space';
import {
  BuildingStorey,
  TBuildingStorey,
  IBuildingStorey,
} from './BuildingStorey';
import { Building, TBuilding, IBuilding } from './Building';
import { Site, TSite, ISite } from './Site';
import { singleton } from './utils';
import { types } from 'mobx-state-tree';

export const SpatialStructureElement = singleton(
  () =>
    types.union(
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
            case Space().name:
              return Space();
          }
          throw new Error(`No valid type found for ${snapshot.type}`);
        },
      },
      Site(),
      Building(),
      BuildingStorey()
    ) as TSite | TBuilding | TBuildingStorey | TSpace
);

export type ISpacialStructureElement =
  | ISite
  | IBuilding
  | IBuildingStorey
  | ISpace;
