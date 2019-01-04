import {
  types as t,
  resolveIdentifier,
  Instance,
  resolvePath,
  IAnyStateTreeNode,
  getIdentifier,
  IAnyModelType,
  addDisposer,
  getEnv,
  getMembers,
  isMapType,
  typecheck,
} from 'mobx-state-tree';
import { set, observable, autorun, IObservableArray } from 'mobx';
import SubscribableEvent from 'subscribableevent';

import {
  referenceObjectEvent,
  ReferenceObjectEvent,
  intentionalSideEffect,
} from './utils';
import { safeEntries } from '../utils/mobx';

export { hamProperties, hamActions } from '../mst-ham';

// type of the environment
export type BaseRootEnv = {
  referenceObjectEvents: IObservableArray<ReferenceObjectEvent>;
};

export const baseRootEnv: BaseRootEnv = {
  referenceObjectEvents: (() => {
    const events = observable.array<ReferenceObjectEvent>([], {
      deep: false,
    });
    referenceObjectEvent.subscribe(event => events.push(event));
    return events;
  })(),
};

export const baseProperties = {
  _id: t.identifier,
};

const _BaseModel = t.model('BaseModel', baseProperties);

export const baseActions = (self: Instance<typeof _BaseModel>) => {
  return {};
};

type FetchRequest = { type: 'fetch'; id: string };
export type Request = FetchRequest;

type UpdateNotification = {
  type: 'update';
  map: string;
  key: string;
  snapshot: any;
};
export type Notification = UpdateNotification;

export type Response = { type: 'fetch'; id: string; snapshot: any };

export const BaseRoot = t
  .model('BaseRoot', {})
  .views(self => ({
    // reflect to find my maps and which union types are in these maps
    get myMapsToTypes() {
      return safeEntries(getMembers(self).properties)
        .filter(([, property]) => isMapType((property as any).type))
        .reduce(
          (map, [key, mapType]) => {
            map[key] = (mapType as any).type.subType;
            return map;
          },
          {} as { [key: string]: IAnyModelType }
        );
    },
  }))

  // expose communication channel
  .volatile(self => ({
    requests: new SubscribableEvent<(request: Request) => void>(),
  }))
  .views(self => ({
    findOrFetch(id: string) {
      // search the maps of this tree for the object
      for (const type of Object.values(self.myMapsToTypes)) {
        const obj = resolveIdentifier(type, self, id);
        if (obj) return obj;
      }

      // if not found, issue a request for this object
      intentionalSideEffect(self, () =>
        self.requests.fire({
          id,
          type: 'fetch',
        })
      );

      return undefined;
    },
  }))
  .actions(self => {
    return {
      add(obj: IAnyStateTreeNode): string | null {
        for (const [mapName, type] of safeEntries(self.myMapsToTypes)) {
          try {
            typecheck(type, obj);
            // TODO we should do a merge here
            set((self as any)[mapName], (obj as any)._id, obj);
            return (obj as any)._id as string;
          } catch (e) {}
        }
        return null;
      },
      addToStore(path: string, obj: IAnyStateTreeNode) {
        set(resolvePath(self, path), getIdentifier(obj), obj);
      },
      notify(response: Response) {
        switch (response.type) {
          case 'fetch':
            // answer to a fetch request
            // find the correct map and add the snapshot to the map
            const { snapshot } = response;
            for (const [mapName, type] of safeEntries(self.myMapsToTypes)) {
              try {
                typecheck(type, snapshot);
                // TODO we should do a merge here
                set((self as any)[mapName], snapshot._id, snapshot);
              } catch (e) {}
            }
            break;
        }
      },
    };
  })

  // expose notification channel
  // .volatile(self => ({
  //   notifications: new SubscribableEvent<(message: Notification) => void>(),
  // }))
  // .actions(self => ({
  //   afterCreate() {
  //     for (const mapName of Object.keys(self.myMapsToTypes)) {
  //       addDisposer(
  //         self,
  //         onPatch((self as any)[mapName], patch => {
  //           const path = splitJsonPath(patch.path);
  //           self.notifications.fire({
  //             type: 'update',
  //             map: mapName,
  //             key: path[0],
  //             snapshot:
  //               patch.op === 'remove'
  //                 ? null
  //                 : getSnapshot(get((self as any)[mapName], path[0])),
  //           });
  //         })
  //       );
  //     }
  //   },
  // }))

  .actions(self => ({
    afterCreate() {
      // listen to the global state events generated in the global reference handler
      // in the future this can maybe go into local scope
      const { referenceObjectEvents } = getEnv<BaseRootEnv>(self);

      addDisposer(
        self,
        autorun(() => {
          if (referenceObjectEvents.length > 0) {
            const { snapshot } = referenceObjectEvents.pop()!;
            debugger;
            const _id = typeof snapshot === 'string' ? snapshot : snapshot._id;

            for (const type of Object.values(self.myMapsToTypes)) {
              const obj = resolveIdentifier(type, self, _id);
              if (obj) {
                (obj as any).sendToStore();
                return;
              }
            }
          }
        })
      );
    },
  }));
