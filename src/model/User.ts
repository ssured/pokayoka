import { Many, RelationsOf, many, One } from './base';
import * as yup from 'yup';
import { generateId } from '../utils/id';
import { projectRelations } from './Project/model';
import { pPersonRelations, pPersonSchema } from './Person';

declare global {
  type PUser = {
    '@type': 'PUser';
    identifier: string;
    /**
     * Person record of the user
     */
    is: One<PPerson>;

    /**
     * Projects this user has access to
     */
    projects: Many<PProject>;
  };
}

// exposes a runtime crawlable model of all relations
// this is needed in Universe to know if an object is a subobject or a primitive
export const userRelations: RelationsOf<PUser> = {
  is: pPersonRelations,
  projects: many(projectRelations),
};

export const userSchema = yup.object<PUser>().shape({
  '@type': yup
    .string()
    .oneOf(['PUser'])
    .required(),
  identifier: yup.string().required(),
  is: pPersonSchema,
  projects: yup.object(),
});

export const isUser = (v: unknown): v is PUser => userSchema.isValidSync(v);

export const newUser = (required: Pick<PUser, 'is'>): PUser => ({
  '@type': 'PUser',
  identifier: generateId(),
  projects: {},
  ...required,
});
