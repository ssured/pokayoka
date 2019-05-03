import { One, Many, RelationsOf, many } from './base';
import { pPersonRelations } from './Person';
import { generateId } from '../utils/id';

declare global {
  type PObservationLocation = {
    '@type': 'PObservationLocation';
    identifier: string;
  } & (
    | {
        locationType: 'sheet';
        sheet: One<PSheet>;
        x: number;
        y: number;
      }
    | {
        locationType: 'element';
        element: One<PProject | PSite | PBuilding | PBuildingStorey>;
      });

  type PObservation = {
    '@type': 'PObservation';
    identifier: string;

    name: string;
    description?: string;

    author: One<PPerson>;

    labels: Record<string, string>; // set of labels
    images: Record<string, string>; // set of hashes
    locations: Many<PObservationLocation>;
  };
}

const pObservationLocationRelations: RelationsOf<PObservationLocation> = {};

export const pObservationRelations: RelationsOf<PObservation> = {
  author: pPersonRelations,
  labels: many({}),
  images: many({}),
  locations: many(pObservationLocationRelations),
};

export const newPObservation = (
  required: Partial<PObservation> & Pick<PObservation, 'name' | 'author'>
): PObservation => ({
  '@type': 'PObservation',
  identifier: generateId(),
  labels: {},
  images: {},
  locations: {},
  ...required,
});
