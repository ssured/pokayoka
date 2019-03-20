import { Space, TSpace, ISpace, spaceType } from './Space';
import {
  BuildingStorey,
  TBuildingStorey,
  IBuildingStorey,
  buildingStoreyType,
} from './BuildingStorey';
import { Building, TBuilding, IBuilding, buildingType } from './Building';
import { Site, TSite, ISite, siteType } from './Site';
import { singleton } from './utils';
import { types } from 'mobx-state-tree';
import { Nothing } from '../graph/maybe';

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

export type ISpatialStructureElement =
  | ISite
  | IBuilding
  | IBuildingStorey
  | ISpace;

export function projectIdFromSpatialStructure(
  spatialStructure: ISpatialStructureElement | Nothing
) {
  let elt = spatialStructure;
  if (elt.type === spaceType) {
    elt = (elt as ISpace).buildingStorey.maybe;
  }
  if (elt.type === buildingStoreyType) {
    elt = (elt as IBuildingStorey).building.maybe;
  }
  if (elt.type === buildingType) {
    elt = (elt as IBuilding).site.maybe;
  }
  if (elt.type === siteType) {
    return (elt as ISite).project.id;
  }
  return null;
}
