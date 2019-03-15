import {
  Instance,
  isStateTreeNode,
  IStateTreeNode,
  SnapshotIn,
  SnapshotOut,
  types,
  getEnv,
} from 'mobx-state-tree';
import { referenceTo, lookupInverse } from '../graph/index';
import { BuildingStorey } from './BuildingStorey';
import { IFCSpatialStructureElement } from './IFC';
import { internalOrExternalEnum } from './types';
import { singleton } from './utils';
import { ObservableAsyncPlaceholder } from '../graph/asyncPlaceholder';
import { IFact, Fact } from './Fact';

const type: 'space' = 'space';

export const Space = singleton(() =>
  types
    .compose(
      type,
      IFCSpatialStructureElement(),
      types.model({
        type,
        typeVersion: 1,

        /**
         * 	Defines, whether the Space is interior (Internal), or exterior (External), i.e. part of the outer space.
         */
        interiorOrExteriorSpace: internalOrExternalEnum,

        /**
         * Level of flooring of this space; the average shall be taken, if the space ground surface is sloping or if there are level differences within this space.
         */
        elevationWithFlooring: types.maybe(types.number),

        /**
         * The building storey this space lies in
         */
        buildingStorey: referenceTo(BuildingStorey()),
      })
    )
    .views(self => ({
      /**
       * Facts in this space
       */
      get facts(): ObservableAsyncPlaceholder<IFact[]> {
        return lookupInverse(getEnv(self), self.id, Fact(), 'parent');
      },
    }))
    .actions(self => ({}))
);

export const isSpace = (obj: IStateTreeNode): obj is TSpaceInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export type TSpace = ReturnType<typeof Space>;
export type TSpaceInstance = Instance<TSpace>;
export type TSpaceSnapshotIn = SnapshotIn<TSpace>;
export type TSpaceSnapshotOut = SnapshotOut<TSpace>;
export interface ISpace extends TSpaceInstance {}
