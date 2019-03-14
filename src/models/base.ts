import { types } from 'mobx-state-tree';
import { singleton } from './utils';
import { mustBeOverwritten } from './types';

export const File = singleton(() =>
  types.model('file', {
    type: 'file',
    sha256: types.string,
    name: types.maybe(types.string),
    mime: types.maybe(types.string),
  })
);

export const base = singleton(() =>
  types.model({
    id: types.identifier,
    type: mustBeOverwritten,
    typeVersion: mustBeOverwritten,
    files: types.map(File()),
  })
);
