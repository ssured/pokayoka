import { types } from 'mobx-state-tree';
import { singleton } from './utils';
import { label, text, globallyUniqueId, elementCompositionEnum } from './types';
import { base } from './base';

export const Root = singleton(() =>
  base()
    .props({
      globalId: types.maybe(types.string),
      // maybe we will support a map of multiple globalIds to refer to source objects
      // globalIds: types.map(types.boolean),
      name: types.maybe(label),
      description: types.maybe(text),
    })
    .actions(self => ({
      // addGlobalId(id: string) {
      //   self.globalIds.set(id, true);
      // },
      // removeGlobalId(id: string) {
      //   if (self.globalIds.has(id)) {
      //     self.globalIds.set(id, false);
      //   }
      // },
      setName(name: string | undefined) {
        self.name = name;
      },
      setDescription(description: string | undefined) {
        self.description = description;
      },
    }))
);

export const ObjectDefinition = Root;

export const Object = ObjectDefinition; /*singleton(() =>
  ObjectDefinition().props({ objectType: types.maybe(label) })
);*/

export const Product = Object; /*singleton(() =>
  Object().props({
    // public ObjectPlacement: IIfcObjectPlacement | undefined
    // public Representation: IIfcProductRepresentation | undefined
  })
);*/

export const SpatialStructureElement = singleton(() =>
  Product().props({
    longName: types.maybe(label),
    compositionType: elementCompositionEnum,
  })
);
