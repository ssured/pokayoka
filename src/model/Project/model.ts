import { runInAction } from 'mobx';
import * as yup from 'yup';
import { generateId } from '../../utils/id';
import { deepM } from '../../utils/universe';
import { Many, RelationsOf, many } from '../base';
import { siteRelations } from '../Site/model';
import { roleRelations } from '../Role';

declare global {
  type PProject = {
    '@type': 'PProject';
    identifier: string;
    code?: string;
    name: string;
    sites: Many<PSite>;
    $image?: string;
    roles: Many<Role>;
  };
}

export const projectRelations: RelationsOf<PProject> = {
  sites: many(siteRelations),
  roles: many(roleRelations),
};

export const pProjectSchema = yup.object<PProject>().shape({
  '@type': yup
    .string()
    .oneOf(['PProject'])
    .required(),
  identifier: yup.string().required(),
  code: yup.string(),
  name: yup.string().required(),
  sites: yup.object(),
  $image: yup.string(),
  roles: yup.object(),
});

export const isPProject = (v: unknown): v is PProject =>
  pProjectSchema.isValidSync(deepM(v));

export const newPProject = (
  required: Partial<PProject> & Pick<PProject, 'name'>
): PProject => ({
  '@type': 'PProject',
  identifier: generateId(),
  sites: {},
  roles: {},
  ...required,
});

// all possible actions on a project follow here

export const projectRemoveRole = (project: PProject, role: Role) =>
  runInAction(() => {
    Object.entries(project.roles || {})
      .filter(([, projectRole]) => projectRole.identifier === role.identifier)
      .forEach(([key]) => delete project.roles![key]);
  });
