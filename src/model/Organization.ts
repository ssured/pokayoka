import { Many } from './base';

declare global {
  type Organization = Partial<{
    '@type': 'Organization';
    identifier: string;

    /**
     * The name of the item.
     */
    name: string;

    member: Many<Role>;

    /**
     * A description of the item.
     */
    description: string;
  }>;
}
