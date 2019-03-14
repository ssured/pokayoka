import { types } from 'mobx-state-tree';
import { singleton } from './utils';
import { label, text, elementCompositionEnum } from './types';
import { base } from './base';

export const IFCRoot = singleton(() =>
  base()
    .props({
      /**
       * Assignment of a globally unique identifier within the entire software world.
       */
      globalId: types.maybe(types.string),

      /**
       * 	Optional name for use by the participating software systems or users. For some subtypes of IfcRoot the insertion of the Name attribute may be required. This would be enforced by a where rule.
       */
      name: types.maybe(label),

      /**
       * Optional description, provided for exchanging informative comments.
       */
      description: types.maybe(text),
    })
    .actions(self => ({
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
    /**
     * 	Long name for a spatial structure element, used for informal purposes. Maybe used in conjunction with the inherited Name attribute.
     */
    longName: types.maybe(label),

    /**
     * Denotes, whether the predefined spatial structure element represents itself, or an aggregate (complex) or a part (part). The interpretation is given separately for each subtype of spatial structure element.
     */
    compositionType: elementCompositionEnum,
  })
);
