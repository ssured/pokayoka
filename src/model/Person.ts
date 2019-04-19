import { Many, RelationsOf, many } from './base';
import * as yup from 'yup';
import { generateId } from '../utils/id';
import { organizationRelations } from './Organization';

declare global {
  type Person = {
    '@type': 'Person';
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

export const personRelations: RelationsOf<Person> = {
  worksFor: many(organizationRelations),
};

export const personSchema = yup.object<Person>().shape({
  // '@type': yup.string().oneOf(['Person']) as yup.Schema<'Person'>,
  // identifier: yup.string().required(),
  familyName: yup.string().required(),
  givenName: yup.string(),
  additionalName: yup.string(),
  email: yup.string().email(),
  telephone: yup.string(),
  description: yup.string(),
  worksFor: yup.object(),
});

export const isPerson = (v: unknown): v is Person =>
  personSchema.isValidSync(v);

export const newPerson = (required: Pick<Person, 'familyName'>): Person => ({
  '@type': 'Person',
  identifier: generateId(),
  worksFor: {},
  ...required,
});
