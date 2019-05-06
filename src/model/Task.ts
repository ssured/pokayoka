import * as yup from 'yup';
import { generateId } from '../utils/id';
import { Many, many, RelationsOf } from './base';
import { pObservationRelations } from './Observation';
import { pPersonRelations } from './Person';

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

export type taskStatus = 'open' | 'closed';

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

type taskAssignedEntry = [string, PAssignment];
const entriesByHierarchy = (
  [, a]: taskAssignedEntry,
  [, b]: taskAssignedEntry
) => a.sortIndex - b.sortIndex;
export function getAssignmentHierarchy(task: PTask) {
  return Object.entries(task.assigned).sort(entriesByHierarchy);
}

export function getAccountable(task: PTask) {
  const hierarchy = getAssignmentHierarchy(task);
  return hierarchy.length > 0 ? hierarchy[0][1].person : undefined;
}

export function getResponsible(task: PTask) {
  const hierarchy = getAssignmentHierarchy(task);
  return hierarchy.length > 1
    ? hierarchy[hierarchy.length - 1][1].person
    : undefined;
}
