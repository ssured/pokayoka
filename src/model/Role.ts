import { One } from './base';
import * as yup from 'yup';
import { generateId } from '../utils/id';
import { personSchema } from './Person';

declare global {
  type Role = {
    '@type': 'Role';
    identifier: string;
    /**
     * A role played, performed or filled by a person or organization. For example, the team of creators for a comic book might fill the roles named 'inker', 'penciller', and 'letterer'; or an athlete in a SportsTeam might play in the position named 'Quarterback'.
     */
    roleName: string;

    member?: One<Person>;

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

export const roleSchema = yup.object<Role>().shape({
  // '@type': yup.string().oneOf(['Role']) as yup.Schema<'Role'>,
  // identifier: yup.string().required(),
  roleName: yup.string().required(),
  member: personSchema.required(),
  startDate: yup.date(),
  endDate: yup.date(),
  description: yup.string(),
});

export const isRole = (v: unknown): v is Role => roleSchema.isValidSync(v);

export const newRole = (required: { roleName: string }): Role => ({
  '@type': 'Role',
  identifier: generateId(),
  ...required,
});
