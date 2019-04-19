import { Many, RelationsOf, many } from './base';
import * as yup from 'yup';
import { generateId } from '../utils/id';
import { projectRelations } from './Project/model';

declare global {
  type User = {
    '@type': 'PYUser';
    identifier: string;
    /**
     * Name of the user
     */
    name?: string;

    /**
     * Projects this user has access to
     */
    projects: Many<PProject>;
  };
}

// exposes a runtime crawlable model of all relations
// this is needed in Universe to know if an object is a subobject or a primitive
export const userRelations: RelationsOf<User> = {
  projects: many(projectRelations),
};

export const userSchema = yup.object<User>().shape({
  '@type': yup
    .string()
    .oneOf(['PYUser'])
    .required(),
  identifier: yup.string().required(),
  name: yup.string(),
  projects: yup.object(),
});

export const isUser = (v: unknown): v is User => userSchema.isValidSync(v);

export const newUser = (): User => ({
  '@type': 'PYUser',
  identifier: generateId(),
  projects: {},
});
