import { One, RelationsOf } from './base';
import * as yup from 'yup';
import { generateId } from '../utils/id';
import { pPersonSchema, pPersonRelations } from './Person';

declare global {
  type PRole = {
    '@type': 'PRole';
    identifier: string;
    /**
     * A role played, performed or filled by a person or organization. For example, the team of creators for a comic book might fill the roles named 'inker', 'penciller', and 'letterer'; or an athlete in a SportsTeam might play in the position named 'Quarterback'.
     */
    roleName: string;

    member: One<PPerson>;

    /**
     * The start date and time of the item (in ISO 8601 date format).
     */
    startDate?: string;
    /**
     * The end date and time of the item (in ISO 8601 date format).
     */
    endDate?: string;

    /**
     * A description of the item.
     */
    description?: string;
  };
}

export const roleRelations: RelationsOf<PRole> = {
  member: pPersonRelations,
};

export const pRoleSchema = yup.object<PRole>().shape({
  '@type': yup.string().oneOf(['PRole']),
  identifier: yup.string().required(),
  roleName: yup.string().required(),
  member: pPersonSchema.required(),
  startDate: yup.date(),
  endDate: yup.date(),
  description: yup.string(),
});

export const isPRole = (v: unknown): v is PRole => pRoleSchema.isValidSync(v);

export const newPRole = (
  required: Pick<PRole, 'roleName' | 'member'>
): PRole => ({
  '@type': 'PRole',
  identifier: generateId(),
  ...required,
});
