import { Many } from '../base';
import { UndefinedOrPartialSPO } from '../../utils/spo-observable';

declare global {
  type Site = Partial<{
    '@type': 'Site';
    identifier: string;
    name: string;
    buildings: Many<Building>;
    tasks: Many<Task>;
    description: string;
  }>;
}

export type PartialSite = UndefinedOrPartialSPO<Site>;
