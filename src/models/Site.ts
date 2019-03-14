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
import { IFCSpatialStructureElement } from './IFC';
import { Project } from './Project';
import { compoundPlaneAngleMeasure, label, postalAddress } from './types';
import { singleton } from './utils';
import { ObservableAsyncPlaceholder } from '../graph/asyncPlaceholder';
import { IBuilding, Building } from './Building';
import { ISheet, Sheet } from './Sheet';

const type: 'site' = 'site';

export const Site = singleton(() =>
  types
    .compose(
      type,
      IFCSpatialStructureElement(),
      types.model({
        type,
        typeVersion: 1,

        /**
         * World Latitude at reference point (most likely defined in legal description). Defined as integer values for degrees, minutes, seconds, and, optionally, millionths of seconds with respect to the world geodetic system WGS84.
         * Latitudes are measured relative to the geodetic equator, north of the equator by positive values - from 0 till +90, south of the equator by negative values - from 0 till -90.
         */
        refLatitude: types.maybe(compoundPlaneAngleMeasure),

        /**
         * World Longitude at reference point (most likely defined in legal description). Defined as integer values for degrees, minutes, seconds, and, optionally, millionths of seconds with respect to the world geodetic system WGS84.
         * Longitudes are measured relative to the geodetic zero meridian, nominally the same as the Greenwich prime meridian: longitudes west of the zero meridian have positive values - from 0 till +180, longitudes east of the zero meridian have negative values - from 0 till -180.
         */
        refLongitude: types.maybe(compoundPlaneAngleMeasure),

        /**
         * 	Datum elevation relative to sea level.
         */
        refElevation: types.maybe(types.number),

        /**
         * The land title number (designation of the site within a regional system).
         */
        landTitleNumber: types.maybe(label),

        /**
         * Address given to the site for postal purposes.
         */
        siteAddress: types.maybe(postalAddress),

        /**
         * The project to which this site belongs to
         */
        project: referenceTo(Project()),
      })
    )
    .views(self => ({
      /**
       * Buildings for this site
       */
      get buildings(): ObservableAsyncPlaceholder<IBuilding[]> {
        return lookupInverse(getEnv(self), self.id, Building(), 'site');
      },

      /**
       * Sheets for this site
       */
      get sheets(): ObservableAsyncPlaceholder<ISheet[]> {
        return lookupInverse(getEnv(self), self.id, Sheet(), 'forObject');
      },
    }))
    .actions(self => ({}))
);

export const isSite = (obj: IStateTreeNode): obj is TSiteInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export type TSite = ReturnType<typeof Site>;
export type TSiteInstance = Instance<TSite>;
export type TSiteSnapshotIn = SnapshotIn<TSite>;
export type TSiteSnapshotOut = SnapshotOut<TSite>;
export interface ISite extends TSiteInstance {}
