import { One, RelationsOf, Many, many } from './base';
import * as yup from 'yup';
import { generateId } from '../utils/id';
import { pPersonSchema, pPersonRelations } from './Person';
import { pObservationRelations } from './Observation';

declare global {
  type PAssignment = {
    sortIndex: number;
    progress?: number;
    person: PPerson;
  };

  type PTask = {
    '@type': 'PTask';
    identifier: string;
    name: string;
    deliverable?: string;

    basedOn: Many<PObservation>;
    assigned: Many<PAssignment>;
  };
}

const pAssignmentRelations: RelationsOf<PAssignment> = {
  person: pPersonRelations,
};

export const pTaskRelations: RelationsOf<PTask> = {
  basedOn: many(pObservationRelations),
  assigned: many(pAssignmentRelations),
};

export const pTaskSchema = yup.object<PTask>().shape({
  '@type': yup.string().oneOf(['PTask']),
  identifier: yup.string().required(),
  name: yup.string().required(),
  deliverable: yup.string(),

  assigned: yup.object(),
});

export const isPTask = (v: unknown): v is PTask => pTaskSchema.isValidSync(v);

export const newPTask = (
  required: Partial<PTask> & Pick<PTask, 'name' | 'assigned' | 'basedOn'>
): PTask => ({
  '@type': 'PTask',
  identifier: generateId(),
  ...required,
});
