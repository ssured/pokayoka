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
    .actions(self => ({
      // tslint:disable-next-line function-name
      _setRev(rev: string) {
        self._rev = rev;
      },
    }))
    //   .preProcessSnapshot(snapshot => snapshot)
    .actions(baseActions)
    .actions(hamActions);
