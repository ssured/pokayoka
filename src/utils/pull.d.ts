import {
  ServerScope,
  DocumentScopeFollowUpdatesParams,
  DatabaseChangesResultItem,
} from 'nano';
import { Source } from 'pull-stream';
import nano = require('nano');

export type Change =
  | (DatabaseChangesResultItem & {
      last_seq: string;
      pending: number;
    })
  | DatabaseChangesResultItem;

export type InSync = { sync: true };
export type NoSyncInfo = { sync?: false };

export type DbChangesSinceLiveOptions = DocumentScopeFollowUpdatesParams & {
  // old: true,
  // live: true,
};

export function dbChangesSinceLive(
  nano: ServerScope,
  name: string,
  options?: DbChangesSinceLiveOptions
): Source<(Change & NoSyncInfo) | InSync>;

export function shareSource<T>(
  sourceCreator: () => Source<T>,
  onActive?: () => void,
  onInactive?: () => void
): Source<T>;
