import { Many, One, RelationsOf, many } from '../base';
import * as yup from 'yup';
import { generateId } from '../../utils/id';
// import { pProjectSchema } from '../Project/model';
import { deepM } from '../../utils/universe';
import { buildingRelations } from '../Building/model';
import { projectRelations } from '../Project/model';

declare global {
  type PSite = {
    '@type': 'PSite';
    identifier: string;
    name: string;

    project: One<PProject>;

    description?: string;
    buildings: Many<PBuilding>;
    // tasks: Many<Task>;
  };
}

export const siteRelations: RelationsOf<PSite> = {
  project: projectRelations,
  buildings: many(buildingRelations),
};

export const pSiteSchema = yup.object<PSite>().shape({
  '@type': yup
    .string()
    .oneOf(['PSite'])
    .required(),
  identifier: yup.string().required(),
  name: yup.string().required(),
  project: yup.object().required(),

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
  // tasks: {},
  ...required,
});
