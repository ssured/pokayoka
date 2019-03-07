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
import { Object } from './IFC';

import { Maybe, Result } from 'true-myth';
import { BelongsToBuildingStorey } from './BuildingStorey';
const { just, nothing } = Maybe;

const type = 'sheet';

export const Sheet = singleton(() =>
  t
    .compose(
      nameFromType(type),
      Object(),
      t.model({
        type,
        typeVersion: 1,
        tiles: t.array(t.string),
      }),
      BelongsToBuildingStorey()
    )
    .actions(self => ({}))
);

export const isSheet = (obj: IStateTreeNode): obj is TSheetInstance =>
  isStateTreeNode(obj) && (obj as any).type === type;

export const BelongsToSheet = singleton(() =>
  t
    .model('BelongsToSheet', { sheetId: t.maybe(t.string) })
    .views(self => ({
      get sheet(): Maybe<Result<Maybe<ISheet>, string>> {
        if (self.sheetId == null) return nothing();
        return just(getEnv<Env>(self).load(Sheet, self.sheetId));
      },
    }))
    .actions(self => ({
      setSheet(sheet?: ISheet) {
        self.sheetId = sheet && getIdentifier(sheet)!;
      },
    }))
);

export const HasManySheets = singleton(() =>
  t
    .model('HasManySheets', { sheetIds: t.map(t.boolean) })
    .views(self => ({
      get sheets(): Result<Maybe<ISheet>, string>[] {
        const validEntries = [...self.sheetIds.entries()].filter(
          ([, value]) => value
        );
        const { load } = getEnv<Env>(self);
        return validEntries.map(([key]) => load(Sheet, key));
      },
    }))
    .actions(self => ({
      addSheet(sheet: ISheet) {
        self.sheetIds.set(getIdentifier(sheet)!, true);
      },
      removeSheet(sheet: ISheet) {
        const sheetId = getIdentifier(sheet)!;
        if (self.sheetIds.has(sheetId)) {
          self.sheetIds.set(sheetId, false);
        }
      },
    }))
);

export type TSheet = ReturnType<typeof Sheet>;
export type TSheetInstance = Instance<TSheet>;
export type TSheetSnapshotIn = SnapshotIn<TSheet>;
export type TSheetSnapshotOut = SnapshotOut<TSheet>;
export interface ISheet extends TSheetInstance {}
