import {
  Instance,
  isStateTreeNode,
  IStateTreeNode,
  SnapshotIn,
  SnapshotOut,
  types,
} from 'mobx-state-tree';
import { singleton } from './utils';

export const personType: 'person' = 'person';

export const Person = singleton(() => {
  return types
    .model({
      id: types.identifier,
      type: personType,
      typeVersion: 1,

      /**
       * Name of the person
       */
      name: types.maybe(types.string),

      /**
       * email address of the person
       */
      email: types.string,
    })

    .actions(self => ({}));
});

export const isPerson = (obj: IStateTreeNode): obj is TPersonInstance =>
  isStateTreeNode(obj) && (obj as any).type === personType;

export type TPerson = ReturnType<typeof Person>;
export type TPersonInstance = Instance<TPerson>;
export type TPersonSnapshotIn = SnapshotIn<TPerson>;
export type TPersonSnapshotOut = SnapshotOut<TPerson>;
export interface IPerson extends TPersonInstance {}
