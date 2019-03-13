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
import { Building } from './Building';

import { Maybe, Result } from 'true-myth';
import { referenceTo } from '../graph/index';
const { just, nothing } = Maybe;

const type = 'buildingStorey';

export const BuildingStorey = singleton(() =>
  t
    .compose(
      nameFromType(type),
      IFCSpatialStructureElement(),
      t.model({
        type,
        typeVersion: 1,
        elevation: t.maybe(t.number),
        building: referenceTo(Building()),
      })
    )
    .actions(self => ({}))
);

export const isBuildingStorey = (
  obj: IStateTreeNode
): obj is TBuildingStoreyInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export const BelongsToBuildingStorey = singleton(() =>
  t
    .model('BelongsToBuildingStorey', { buildingStoreyId: t.maybe(t.string) })
    .views(self => ({
      get buildingStorey(): Maybe<Result<Maybe<IBuildingStorey>, string>> {
        if (self.buildingStoreyId == null) return nothing();
        return just(
          getEnv<Env>(self).load(BuildingStorey, self.buildingStoreyId)
        );
      },
    }))
    .actions(self => ({
      setBuildingStorey(buildingStorey?: IBuildingStorey) {
        self.buildingStoreyId =
          buildingStorey && getIdentifier(buildingStorey)!;
      },
    }))
);

export const HasManyBuildingStoreys = singleton(() =>
  t
    .model('HasManyBuildingStoreys', { buildingStoreyIds: t.map(t.boolean) })
    .views(self => ({
      get buildingStoreys(): Result<Maybe<IBuildingStorey>, string>[] {
        const validEntries = [...self.buildingStoreyIds.entries()].filter(
          ([, value]) => value
        );
        const { load } = getEnv<Env>(self);
        return validEntries.map(([key]) => load(BuildingStorey, key));
      },
    }))
    .actions(self => ({
      addBuildingStorey(buildingStorey: IBuildingStorey) {
        self.buildingStoreyIds.set(getIdentifier(buildingStorey)!, true);
      },
      removeBuildingStorey(buildingStorey: IBuildingStorey) {
        const buildingStoreyId = getIdentifier(buildingStorey)!;
        if (self.buildingStoreyIds.has(buildingStoreyId)) {
          self.buildingStoreyIds.set(buildingStoreyId, false);
        }
      },
    }))
);

export type TBuildingStorey = ReturnType<typeof BuildingStorey>;
export type TBuildingStoreyInstance = Instance<TBuildingStorey>;
export type TBuildingStoreySnapshotIn = SnapshotIn<TBuildingStorey>;
export type TBuildingStoreySnapshotOut = SnapshotOut<TBuildingStorey>;
export interface IBuildingStorey extends TBuildingStoreyInstance {}
