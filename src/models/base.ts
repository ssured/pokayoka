import { types } from 'mobx-state-tree';
import { singleton } from './utils';

const fileType: 'file' = 'file';

export const File = singleton(() =>
  types
    .model('file', {
      type: fileType,
      sha256: types.maybe(types.string),
      name: types.maybe(types.string),
      mime: types.maybe(types.string),
    })
    .views(self => ({
      src(projectId: string) {
        return `/cdn/${projectId}/${self.sha256}`;
      },
    }))
);

export const base = singleton(() =>
  types.model({
    id: types.identifier,
    files: types.map(File()),
  })
);
