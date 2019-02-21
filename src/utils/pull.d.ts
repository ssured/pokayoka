import {
  ServerScope,
  DocumentScopeFollowUpdatesParams,
  DatabaseChangesResultItem,
} from 'nano';
import { Source } from 'pull-stream';
import nano = require('nano');

export type Change = DatabaseChangesResultItem & {
  last_seq: string;
  pending: number;
};

export type DbChangesSinceLiveOptions = DocumentScopeFollowUpdatesParams & {
  // old: true,
  // live: true,
};

export function dbChangesSinceLive(
  nano: ServerScope,
  name: string,
  options?: DbChangesSinceLiveOptions
): Source<Change>;

export function shareSource<T>(
  sourceCreator: () => Source<T>,
  onActive?: () => void,
  onInactive?: () => void
): Source<T>;
