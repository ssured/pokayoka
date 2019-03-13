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
import { postalAddress } from './types';
import { Site } from './Site';

import { Maybe, Result } from 'true-myth';
import { referenceTo } from '../graph/index';
const { just, nothing } = Maybe;

const type = 'building';

export const Building = singleton(() =>
  t
    .compose(
      nameFromType(type),
      IFCSpatialStructureElement(),
      t.model({
        type,
        typeVersion: 1,
        elevationOfRefHeight: t.maybe(t.number),
        elevationOfTerrain: t.maybe(t.number),
        buildingAddress: t.maybe(postalAddress),
        site: referenceTo(Site()),
      })
    )
    .actions(self => ({}))
);

export const isBuilding = (obj: IStateTreeNode): obj is TBuildingInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export const BelongsToBuilding = singleton(() =>
  t
    .model('BelongsToBuilding', { buildingId: t.maybe(t.string) })
    .views(self => ({
      get building(): Maybe<Result<Maybe<IBuilding>, string>> {
        if (self.buildingId == null) return nothing();
        return just(getEnv<Env>(self).load(Building, self.buildingId));
      },
    }))
    .actions(self => ({
      setBuilding(building?: IBuilding) {
        self.buildingId = building && getIdentifier(building)!;
      },
    }))
);

export const HasManyBuildings = singleton(() =>
  t
    .model('HasManyBuildings', { buildingIds: t.map(t.boolean) })
    .views(self => ({
      get buildings(): Result<Maybe<IBuilding>, string>[] {
        const validEntries = [...self.buildingIds.entries()].filter(
          ([, value]) => value
        );
        const { load } = getEnv<Env>(self);
        return validEntries.map(([key]) => load(Building, key));
      },
    }))
    .actions(self => ({
      addBuilding(building: IBuilding) {
        self.buildingIds.set(getIdentifier(building)!, true);
      },
      removeBuilding(building: IBuilding) {
        const buildingId = getIdentifier(building)!;
        if (self.buildingIds.has(buildingId)) {
          self.buildingIds.set(buildingId, false);
        }
      },
    }))
);

export type TBuilding = ReturnType<typeof Building>;
export type TBuildingInstance = Instance<TBuilding>;
export type TBuildingSnapshotIn = SnapshotIn<TBuilding>;
export type TBuildingSnapshotOut = SnapshotOut<TBuilding>;
export interface IBuilding extends TBuildingInstance {}
