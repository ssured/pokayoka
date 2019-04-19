import { Many, RelationsOf, many } from './base';
import { roleRelations } from './Role';

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

export const organizationRelations: RelationsOf<Organization> = {
  member: many(roleRelations),
};
