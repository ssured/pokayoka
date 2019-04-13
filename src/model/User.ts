import { Many } from './base';

declare global {
  type User = {
    '@type': 'PYUser';
    identifier: string;
  } & Partial<{
    /**
     * Name of the user
     */
    name: string;

    /**
     * Projects this user has access to
     */
    projects: Many<IFCProject>;
  }>;
}
