import { Many } from '../base';
import { UndefinedOrPartialSPO } from '../../utils/spo-observable';

declare global {
  type Building = Partial<{
    '@type': 'Building';
    identifier: string;
    name: string;
    $image: string;
    description: string;
    tasks: Many<Task>;
    buildingStoreys: Many<BuildingStorey>;
  }>;
}

export type PartialBuilding = UndefinedOrPartialSPO<Building>;
