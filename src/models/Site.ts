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

import { singleton } from './utils';
import { base } from './base';
import { BelongsToProject } from './Project';

const siteType = 'site';

// VERSION 1
const siteV1Props = {
  title: t.string,
};

const SiteV1Model = singleton(() => t.model(siteType, siteV1Props));
type SnapshotInSiteV1 = SnapshotIn<typeof SiteV1Model>;

const toSnapshot1 = (snapshot: SnapshotInSiteV1) => snapshot;

// VERSION 2

// GENERAL IMPLEMENTATION

export const Site = singleton(() =>
  t
    .compose(
      'Site',
      base(),
      BelongsToProject(),
      SiteV1Model()
    )
    .preProcessSnapshot(toSnapshot1 as any)
    .actions(self => ({
      setTitle(title: string) {
        self.title = title;
      },
    }))
);

type SiteType = ReturnType<typeof Site>;
export type TSiteInstance = Instance<SiteType>;
export type TSiteSnapshotIn = SnapshotIn<SiteType>;
export type TSiteSnapshotOut = SnapshotOut<SiteType>;
export type TSite = TSiteSnapshotIn | TSiteInstance;

export interface ISite extends TSiteInstance {}

export const isSite = (obj: IStateTreeNode): obj is TSiteInstance =>
  isStateTreeNode(obj) && (obj as any).type === siteType;

export const BelongsToSite = singleton(() =>
  t
    .model('BelongsToSite', { siteId: t.maybe(t.string) })
    .views(self => ({
      get site(): ISite | undefined | null {
        return self.siteId && getEnv(self).load(Site, self.siteId);
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
      get allSites(): (ISite | string)[] {
        const validEntries = [...self.siteIds.entries()].filter(
          ([, value]) => value
        );
        const { load } = getEnv(self);
        return validEntries.map(([key]) => load(Site, key) || key);
      },
    }))
    .views(self => ({
      get sites(): ISite[] {
        return self.allSites.filter(
          site => typeof site !== 'string'
        ) as ISite[];
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
