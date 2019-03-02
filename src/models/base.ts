import { types } from 'mobx-state-tree';
import { HamModel as hamdoc } from '../mst-ham';
import { singleton } from './utils';
import { mustBeOverwritten } from './types';

export const base = singleton(() =>
  hamdoc.named('base').props({
    _id: types.identifier,
    _attachments: types.maybe(types.frozen()),

    type: mustBeOverwritten,
    typeVersion: mustBeOverwritten,
  })
);
