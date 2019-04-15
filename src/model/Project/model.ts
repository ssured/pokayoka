import { Many } from '../base';

import { UndefinedOrPartialSPO } from '../../utils/spo-observable';

declare global {
  type IFCProject = Partial<{
    '@type': 'IFCProject';
    identifier: string;
    code: string;
    name: string;
    sites: Many<Site>;
    $image: string;
    roles: Many<Role>;
  }>;
}

export type PartialProject = UndefinedOrPartialSPO<IFCProject>;
