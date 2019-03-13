import { types } from 'mobx-state-tree';
import { singleton } from './utils';
import { mustBeOverwritten } from './types';

export const File = singleton(() =>
  types.model('file', { $cdn: types.string })
);

export const base = singleton(() =>
  types.model({
    id: types.identifier,
    type: mustBeOverwritten,
    typeVersion: mustBeOverwritten,
    files: types.map(File()),
  })
);
