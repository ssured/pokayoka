import { types } from 'mobx-state-tree';
import {
  baseProperties,
  hamProperties,
  baseActions,
  hamActions,
} from '../store/base';

export { referenceHandler } from '../store/utils';

export const base = (name: string) =>
  types
    .model(name, {
      _rev: types.maybe(types.string), // for couchdb
      type: name,
      ...baseProperties,
      ...hamProperties,
    })
    //   .preProcessSnapshot(snapshot => snapshot)
    .actions(baseActions)
    .actions(hamActions);
