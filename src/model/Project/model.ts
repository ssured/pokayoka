import { Many } from '../base';
import * as yup from 'yup';

import { runInAction } from 'mobx';

declare global {
  type IFCProject = Partial<{
    '@type': 'IFCProject';
    identifier: string;
    code: string;
    name: string;
    sites: Many<Site>;
    $image: string;
    roles: Many<Role>;
  }>;
}

export const projectSchema = yup.object<Person>().shape({
  '@type': yup
    .string()
    .oneOf(['Project'])
    .required() as yup.Schema<'Project'>,
  identifier: yup.string().required(),
  code: yup.string(),
  name: yup.string().required(),
  sites: yup.object(),
  $image: yup.string(),
  roles: yup.object(),
});

export const isProject = (v: unknown): v is IFCProject =>
  projectSchema.isValidSync(v);

export const projectRemoveRole = (project: IFCProject, role: Role) =>
  runInAction(() => {
    Object.entries(project.roles || {})
      .filter(([, projectRole]) => projectRole.identifier === role.identifier)
      .forEach(([key]) => delete project.roles![key]);
  });
