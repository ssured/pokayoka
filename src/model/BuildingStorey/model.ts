import { Many, RelationsOf } from '../base';

declare global {
  type PBuildingStorey = {
    '@type': 'BuildingStorey';
    identifier: string;
    name: string;
    $image?: string;
    description?: string;
    // tasks: Many<Task>;
    // sheets: Many<Sheet>;
  };
}

export const buildingStoreyRelations: RelationsOf<PBuildingStorey> = {};
