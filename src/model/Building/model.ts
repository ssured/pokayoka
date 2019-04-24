import { Many, RelationsOf, many } from '../base';
import { buildingStoreyRelations } from '../BuildingStorey/model';
import * as yup from 'yup';
import { generateId } from '../../utils/id';
import { deepM } from '../../utils/universe';

declare global {
  type PBuilding = {
    '@type': 'PBuilding';
    identifier: string;
    name: string;
    $image?: string;
    description?: string;
    // tasks: Many<Task>;
    buildingStoreys: Many<PBuildingStorey>;
  };
}

export const buildingRelations: RelationsOf<PBuilding> = {
  buildingStoreys: many(buildingStoreyRelations),
};

export const pBuildingSchema = yup.object<PBuilding>().shape({
  '@type': yup
    .string()
    .oneOf(['PBuilding'])
    .required(),
  identifier: yup.string().required(),
  name: yup.string().required(),

  $image: yup.string(),
  description: yup.string(),

  buildingStoreys: yup.object(),
  // tasks: yup.object(),
});

export const isPBuilding = (v: unknown): v is PBuilding =>
  pBuildingSchema.isValidSync(deepM(v));

export const newPBuilding = (
  required: Partial<PBuilding> & Pick<PBuilding, 'name'>
): PBuilding => ({
  '@type': 'PBuilding',
  identifier: generateId(),
  buildingStoreys: {},
  // tasks: {},
  ...required,
});
