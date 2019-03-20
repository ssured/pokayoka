import { types, getEnv } from 'mobx-state-tree';
import { singleton } from './utils';
import { label, text, elementCompositionEnum } from './types';
import { base } from './base';
import { ObservableAsyncPlaceholder } from '../graph/asyncPlaceholder';
import { ISheet, Sheet } from './Sheet';
import { lookupInverse } from '../graph/index';
import { IObservation, Observation } from './Observation';
import { ITask, Task } from './Task';

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
  IFCProduct()
    .props({
      /**
       * 	Long name for a spatial structure element, used for informal purposes. Maybe used in conjunction with the inherited Name attribute.
       */
      longName: types.maybe(label),

      /**
       * Denotes, whether the predefined spatial structure element represents itself, or an aggregate (complex) or a part (part). The interpretation is given separately for each subtype of spatial structure element.
       */
      compositionType: elementCompositionEnum,
    })
    .views(self => ({
      /**
       * Observations for this spatial structure
       */
      get observations(): ObservableAsyncPlaceholder<IObservation[]> {
        return lookupInverse(
          getEnv(self),
          self.id,
          Observation(),
          'spatialStructure'
        );
      },
      /**
       * Tasks for this spatial structure
       */
      get tasks(): ObservableAsyncPlaceholder<ITask[]> {
        return lookupInverse(getEnv(self), self.id, Task(), 'spatialStructure');
      },
      /**
       * Sheets for this spatial structure
       */
      get sheets(): ObservableAsyncPlaceholder<ISheet[]> {
        return lookupInverse(
          getEnv(self),
          self.id,
          Sheet(),
          'spatialStructure'
        );
      },
    }))
);
