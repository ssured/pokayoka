import { Many, RelationsOf, many, One } from '../base';
import * as yup from 'yup';
import { generateId } from '../../utils/id';
import { sheetRelations } from '../Sheet/model';

declare global {
  type PBuildingStorey = {
    '@type': 'PBuildingStorey';
    identifier: string;
    name: string;
    description?: string;
    // tasks: Many<Task>;
    activeSheet?: One<PSheet>;
    sheets: Many<PSheet>;
  };
}

export const buildingStoreyRelations: RelationsOf<PBuildingStorey> = {
  activeSheet: sheetRelations,
  sheets: many(sheetRelations),
};

export const pBuildingStoreySchema = yup.object<PBuildingStorey>().shape({
  '@type': yup
    .string()
    .oneOf(['PBuildingStorey'])
    .required(),
  identifier: yup.string().required(),
  name: yup.string().required(),

  description: yup.string(),

  sheets: yup.object(),
  activeSheet: yup.object(),
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
  sheets: {},
  ...required,
});
