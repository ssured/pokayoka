import { Many, RelationsOf, many } from './base';
import * as yup from 'yup';
import { generateId } from '../utils/id';
import { organizationRelations } from './Organization';

declare global {
  type PPerson = {
    '@type': 'PPerson';
    identifier: string;
    /**
     * Family name. In the U.S., the last name of an Person. This can be used along with givenName instead of the name property.
     */
    familyName: string;

    /**
     * Given name. In the U.S., the first name of a Person. This can be used along with familyName instead of the name property.
     */
    givenName?: string;
    /**
     * An additional name for a Person, can be used for a middle name.
     */
    additionalName?: string;
    /**
     * Email address.
     */
    email?: string;
    /**
     * The telephone number.
     */
    telephone?: string;
    /**
     * A description of the item.
     */
    description?: string;

    worksFor: Many<Organization>;
  };
}

export const pPersonRelations: RelationsOf<PPerson> = {
  worksFor: many(organizationRelations),
};

export const pPersonSchema = yup.object<PPerson>().shape({
  '@type': yup.string().oneOf(['PPerson']),
  identifier: yup.string().required(),
  familyName: yup.string().required(),
  givenName: yup.string(),
  additionalName: yup.string(),
  email: yup.string().email(),
  telephone: yup.string(),
  description: yup.string(),
  worksFor: yup.object(),
});

export const isPPerson = (v: unknown): v is PPerson =>
  pPersonSchema.isValidSync(v);

export const newPPerson = (required: Pick<PPerson, 'familyName'>): PPerson => ({
  '@type': 'PPerson',
  identifier: generateId(),
  worksFor: {},
  ...required,
});

/**
 * Returns the full name of the person
 * @param person The person
 */
export function fullName(person: PPerson) {
  return [person.givenName, person.additionalName, person.familyName]
    .filter(Boolean)
    .join(' ');
}
