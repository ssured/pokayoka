import { Many } from './base';

declare global {
  type Person = Partial<{
    '@type': 'Person';
    identifier: string;
    /**
     * Family name. In the U.S., the last name of an Person. This can be used along with givenName instead of the name property.
     */
    familyName: string;

    /**
     * Given name. In the U.S., the first name of a Person. This can be used along with familyName instead of the name property.
     */
    givenName: string;
    /**
     * An additional name for a Person, can be used for a middle name.
     */
    additionalName: string;
    /**
     * Email address.
     */
    email: string;
    /**
     * The telephone number.
     */
    telephone: string;
    /**
     * A description of the item.
     */
    description: string;

    worksFor: Many<Organization>;
  }>;
}
