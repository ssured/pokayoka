import { Many, RelationsOf } from '../base';
import * as yup from 'yup';
import { generateId } from '../../utils/id';

declare global {
  type PBuildingStorey = {
    '@type': 'PBuildingStorey';
    identifier: string;
    name: string;
    description?: string;
    // tasks: Many<Task>;
    // sheets: Many<Sheet>;
  };
}

export const buildingStoreyRelations: RelationsOf<PBuildingStorey> = {};

export const pBuildingStoreySchema = yup.object<PBuildingStorey>().shape({
  '@type': yup
    .string()
    .oneOf(['PBuildingStorey'])
    .required(),
  identifier: yup.string().required(),
  name: yup.string().required(),

  description: yup.string(),

  // buildingStoreys: yup.object(),
  // tasks: yup.object(),
});

export const isPBuildingStorey = (v: unknown): v is PBuildingStorey =>
  pBuildingStoreySchema.isValidSync(v);

export const newPBuildingStorey = (
  required: Partial<PBuildingStorey> & Pick<PBuildingStorey, 'name'>
): PBuildingStorey => ({
  '@type': 'PBuildingStorey',
  identifier: generateId(),
  // buildingStoreys: {},
  // tasks: {},
  ...required,
});
