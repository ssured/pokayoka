import Maybe, { just, nothing } from 'true-myth/maybe';
import Result from 'true-myth/result';

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

import { BelongsToProject } from './Project';
import { singleton, nameFromType, Env } from './utils';
import { SpatialStructureElement } from './IFC';
import { label, compoundPlaneAngleMeasure, postalAddress } from './types';
import { HasManyBuildings } from './Building';

const type = 'site';

export const Site = singleton(() =>
  t
    .compose(
      nameFromType(type),
      SpatialStructureElement(),
      t.model({
        type,
        typeVersion: 1,
        refLatitude: t.maybe(compoundPlaneAngleMeasure),
        refLongitude: t.maybe(compoundPlaneAngleMeasure),
        refElevation: t.maybe(t.number),
        landTitleNumber: t.maybe(label),
        siteAddress: t.maybe(postalAddress),
      }),
      BelongsToProject(),
      HasManyBuildings()
    )
    .actions(self => ({}))
);

export const isSite = (obj: IStateTreeNode): obj is TSiteInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export const BelongsToSite = singleton(() =>
  t
    .model('BelongsToSite', { siteId: t.maybe(t.string) })
    .views(self => ({
      get site(): Maybe<Result<Maybe<ISite>, string>> {
        if (self.siteId == null) return nothing();
        return just(getEnv<Env>(self).load(Site, self.siteId));
      },
    }))
    .actions(self => ({
      setSite(site?: ISite) {
        self.siteId = site && getIdentifier(site)!;
      },
    }))
);

export const HasManySites = singleton(() =>
  t
    .model('HasManySites', { siteIds: t.map(t.boolean) })
    .views(self => ({
      get sites(): Result<Maybe<ISite>, string>[] {
        const validEntries = [...self.siteIds.entries()].filter(
          ([, value]) => value
        );
        const { load } = getEnv<Env>(self);
        return validEntries.map(([key]) => load(Site, key));
      },
    }))
    .actions(self => ({
      addSite(site: ISite) {
        self.siteIds.set(getIdentifier(site)!, true);
      },
      removeSite(site: ISite) {
        const siteId = getIdentifier(site)!;
        if (self.siteIds.has(siteId)) {
          self.siteIds.set(siteId, false);
        }
      },
    }))
);

export type TSite = ReturnType<typeof Site>;
export type TSiteInstance = Instance<TSite>;
export type TSiteSnapshotIn = SnapshotIn<TSite>;
export type TSiteSnapshotOut = SnapshotOut<TSite>;
export interface ISite extends TSiteInstance {}
