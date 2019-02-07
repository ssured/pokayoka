import { types } from 'mobx-state-tree';
import { pouchdoc } from './pouchdoc';
import { HamModel as hamdoc } from '../mst-ham';

export const base = types.compose(
  pouchdoc,
  hamdoc
);
