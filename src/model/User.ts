import { Many } from './base';

declare global {
  type User = Partial<{
    '@type': 'PYUser';
    identifier: string;
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
