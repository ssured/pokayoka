import { Many, One } from '../base';
import * as yup from 'yup';
import { generateId } from '../../utils/id';
import { pProjectSchema } from '../Project/model';
import { deepM } from '../../utils/universe';

declare global {
  type PSite = {
    '@type': 'PSite';
    identifier: string;
    name: string;

    project: One<PProject>;

    description?: string;
    buildings: Many<Building>;
    tasks: Many<Task>;
  };
}

export const pSiteSchema = yup.object<PSite>().shape({
  '@type': yup
    .string()
    .oneOf(['PSite'])
    .required(),
  identifier: yup.string().required(),
  name: yup.string().required(),
  project: pProjectSchema.required(),

  description: yup.string(),

  buildings: yup.object(),
  tasks: yup.object(),
});

export const isPSite = (v: unknown): v is PSite =>
  pSiteSchema.isValidSync(deepM(v));

export const newPSite = (
  required: Partial<PSite> & Pick<PSite, 'name' | 'project'>
): PSite => ({
  '@type': 'PSite',
  identifier: generateId(),
  buildings: {},
  tasks: {},
  ...required,
});
