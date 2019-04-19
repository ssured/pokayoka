import { Many, RelationsOf, many } from '../base';
import { buildingStoreyRelations } from '../BuildingStorey/model';

declare global {
  type PBuilding = {
    '@type': 'Building';
    identifier: string;
    name: string;
    $image: string;
    description: string;
    // tasks: Many<Task>;
    buildingStoreys: Many<PBuildingStorey>;
  };
}

export const buildingRelations: RelationsOf<PBuilding> = {
  buildingStoreys: many(buildingStoreyRelations),
};
