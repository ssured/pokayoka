import { Many } from './base';

declare global {
  type Organization = {
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
    description?: string;
  };
}
