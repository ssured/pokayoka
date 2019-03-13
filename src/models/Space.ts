import {
  types as t,
  SnapshotIn,
  Instance,
  SnapshotOut,
  IStateTreeNode,
  isStateTreeNode,
  getEnv,
  getIdentifier,
} from 'mobx-state-tree';

import { singleton, nameFromType, Env } from './utils';
import { IFCSpatialStructureElement } from './IFC';
import { internalOrExternalEnum } from './types';
import { BuildingStorey } from './BuildingStorey';

import { Maybe, Result } from 'true-myth';
import { referenceTo } from '../graph/index';
const { just, nothing } = Maybe;

const type = 'space';

export const Space = singleton(() =>
  t
    .compose(
      nameFromType(type),
      IFCSpatialStructureElement(),
      t.model({
        type,
        typeVersion: 1,
        interiorOrExteriorSpace: internalOrExternalEnum,
        elevationWithFlooring: t.maybe(t.number),
        buildingStorey: referenceTo(BuildingStorey()),
      })
    )
    .actions(self => ({}))
);

export const isSpace = (obj: IStateTreeNode): obj is TSpaceInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export const BelongsToSpace = singleton(() =>
  t
    .model('BelongsToSpace', { spaceId: t.maybe(t.string) })
    .views(self => ({
      get space(): Maybe<Result<Maybe<ISpace>, string>> {
        if (self.spaceId == null) return nothing();
        return just(getEnv<Env>(self).load(Space, self.spaceId));
      },
    }))
    .actions(self => ({
      setSpace(space?: ISpace) {
        self.spaceId = space && getIdentifier(space)!;
      },
    }))
);

export const HasManySpaces = singleton(() =>
  t
    .model('HasManySpaces', { spaceIds: t.map(t.boolean) })
    .views(self => ({
      get spaces(): Result<Maybe<ISpace>, string>[] {
        const validEntries = [...self.spaceIds.entries()].filter(
          ([, value]) => value
        );
        const { load } = getEnv<Env>(self);
        return validEntries.map(([key]) => load(Space, key));
      },
    }))
    .actions(self => ({
      addSpace(space: ISpace) {
        self.spaceIds.set(getIdentifier(space)!, true);
      },
      removeSpace(space: ISpace) {
        const spaceId = getIdentifier(space)!;
        if (self.spaceIds.has(spaceId)) {
          self.spaceIds.set(spaceId, false);
        }
      },
    }))
);

export type TSpace = ReturnType<typeof Space>;
export type TSpaceInstance = Instance<TSpace>;
export type TSpaceSnapshotIn = SnapshotIn<TSpace>;
export type TSpaceSnapshotOut = SnapshotOut<TSpace>;
export interface ISpace extends TSpaceInstance {}
