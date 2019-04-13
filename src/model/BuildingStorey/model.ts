import { Many } from '../base';
import { UndefinedOrPartialSPO } from '../../utils/spo-observable';

declare global {
  type BuildingStorey = Partial<{
    '@type': 'BuildingStorey';
    identifier: string;
    name: string;
    $image: string;
    description: string;
    tasks: Many<Task>;
    sheets: Many<Sheet>;
  }>;
}

export type PartialBuildingStorey = UndefinedOrPartialSPO<BuildingStorey>;
