import { types as t } from 'mobx-state-tree';
import { singleton } from './utils';

export const pouchdoc = singleton(
  () =>
    t.model('PouchDoc', {
      _id: t.identifier,
      // _rev: t.maybe(t.string),
      _attachments: t.frozen() /*t.optional(
      t.map(
        t
          .model('Attachment', {
            content_type: t.string,
            revpos: t.union(t.number, t.undefined),
            digest: t.union(t.string, t.undefined),
            length: t.union(t.number, t.undefined),
            stub: t.union(t.boolean, t.undefined),
            data: t.union(t.string, t.undefined),
          })
          .views(self => ({
            get attachmentName() {
              const map = getParent<Instance<typeof pouchdoc>['_attachments']>(
                self
              );
              for (const [key, value] of map.entries()) {
                if (value === self) {
                  return key;
                }
              }
            },
          }))
          .views(self => ({
            get src() {
              if (self.data) {
                return `data:${self.content_type};base64,${self.data}`;
              }
              const doc = getParent<Instance<typeof pouchdoc>>(self, 2);
              return getData(self).objectUrl(doc._id, self.attachmentName);
            },
            get dataURL() {
              if (self.data) {
                return `data:${self.content_type};base64,${self.data}`;
              }
              const doc = getParent(self, 2);
              return getData(self).dataURL(doc._id, self.attachmentName);
            },
          }))
      ),
      {}
    )*/,
    })
  // .actions(self => ({
  //   setRev(rev: string) {
  //     self._rev = rev;
  //   },
  // }))
);
// .actions(self => ({
//   addAttachment(name, content_type, data) {
//     self._attachments.set(name, { content_type, data });
//   },
//   removeAttachment(name) {
//     if (self._attachments.has(name)) self._attachments.delete(name);
//   },
// }));
