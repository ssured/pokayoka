import {
  Instance,
  isStateTreeNode,
  IStateTreeNode,
  SnapshotIn,
  SnapshotOut,
  types,
} from 'mobx-state-tree';
import { referenceTo } from '../graph/index';
import { singleton } from './utils';
import { base } from './base';
import { Observation } from './Observation';
import { SpatialStructureElement } from './union';

export const taskType: 'task' = 'task';

// recursive type does not work
// // type explicitly to allow for recursion
// type AssignmentType = IModelType<
//   ModelPropertiesDeclarationToProperties<{
//     person: ISimpleType<string>; // IAsyncReferenceType<ReturnType<typeof Person>>;
//     progress: IOptionalIType<ISimpleType<number>>;
//     delegatedTo: IMaybe<IAsyncReferenceType<AssignmentType>>;
//   }>,
//   {}
// >;

const Assignment = types.model({
  person: types.string, // TODO referenceTo(Person()),
  progress: types.optional(types.number, 0),
  delegatedFrom: types.maybe(types.string), // TODO referenceTo(Person()),
});

type TAssignment = Instance<typeof Assignment>;
interface IAssignment extends TAssignment {}

export const Task = singleton(() =>
  types
    .compose(
      taskType,
      base(),
      types.model({
        type: taskType,
        typeVersion: 1,

        /**
         * Short indicative name
         */
        name: types.string,

        /**
         * Description of what has to be accomplished
         */
        deliverable: types.maybe(types.string),

        /**
         * If the task originated from an observation, this must be the observation
         */
        basedOn: types.maybe(referenceTo(Observation())),

        /**
         * What does this task relate to?
         * Site, Building, BuildingStorey or Space
         */
        spatialStructure: referenceTo(SpatialStructureElement()),

        /**
         * Who is assigned?
         */
        assignment: types.map(Assignment),

        labels: types.map(types.string),
      })
    )
    .views(self => ({
      get chainOfCommand(): (IAssignment & { key: string })[] {
        const assignments = [...self.assignment.entries()];
        const chain: (IAssignment & { key: string })[] = [];
        let currentPerson: string | undefined = undefined;
        let entry: [string, TAssignment] | undefined;
        const seenPersons = new Set<string>();
        while (
          (entry = assignments.find(
            ([, a]) => a.delegatedFrom === currentPerson
          ))
        ) {
          const [key, delegated] = entry;
          chain.push({ ...delegated, key });
          currentPerson = delegated.person;
          // detect cycles
          if (seenPersons.has(currentPerson)) break;
          seenPersons.add(currentPerson);
        }
        return chain;
      },
    }))
    .actions(self => ({}))
);

export const isTask = (obj: IStateTreeNode): obj is TTaskInstance =>
  isStateTreeNode(obj) && (obj as any).type === taskType;

export type TTask = ReturnType<typeof Task>;
export type TTaskInstance = Instance<TTask>;
export type TTaskSnapshotIn = SnapshotIn<TTask>;
export type TTaskSnapshotOut = SnapshotOut<TTask>;
export interface ITask extends TTaskInstance {}
