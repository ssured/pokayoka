import { types } from 'mobx-state-tree';
import { pouchdoc } from './pouchdoc';
import { HamModel as hamdoc } from '../mst-ham';
import { singleton } from './utils';

export const base = singleton(() =>
  types.compose(
    pouchdoc(),
    hamdoc
  )
);
