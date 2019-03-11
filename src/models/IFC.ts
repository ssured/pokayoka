import { types } from 'mobx-state-tree';
import { singleton } from './utils';
import { label, text, globallyUniqueId, elementCompositionEnum } from './types';
import { base } from './base';

export const IFCRoot = singleton(() =>
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

export const IFCObjectDefinition = IFCRoot;

export const IFCObject = IFCObjectDefinition; /*singleton(() =>
  ObjectDefinition().props({ objectType: types.maybe(label) })
);*/

export const IFCProduct = IFCObject; /*singleton(() =>
  Object().props({
    // public ObjectPlacement: IIfcObjectPlacement | undefined
    // public Representation: IIfcProductRepresentation | undefined
  })
);*/

export const IFCSpatialStructureElement = singleton(() =>
  IFCProduct().props({
    longName: types.maybe(label),
    compositionType: elementCompositionEnum,
  })
);
