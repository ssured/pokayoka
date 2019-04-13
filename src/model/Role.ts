import { One } from './base';

declare global {
  type Role = {
    '@type': 'Role';
    identifier: string;
  } & Partial<{
    /**
     * A role played, performed or filled by a person or organization. For example, the team of creators for a comic book might fill the roles named 'inker', 'penciller', and 'letterer'; or an athlete in a SportsTeam might play in the position named 'Quarterback'.
     */
    roleName: string;

    member: One<Person>;

    /**
     * The start date and time of the item (in ISO 8601 date format).
     */
    startDate: string;
    /**
     * The end date and time of the item (in ISO 8601 date format).
     */
    endDate: string;

    /**
     * A description of the item.
     */
    description: string;
  }>;
}
