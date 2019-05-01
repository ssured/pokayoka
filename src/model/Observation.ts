import { One, Many, RelationsOf, many } from './base';
import { pPersonRelations } from './Person';

type PObservationLocation = {
  '@type': 'PObservationLocation';
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

const pObservationLocationRelations: RelationsOf<PObservationLocation> = {};

declare global {
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

export const pObservationRelations: RelationsOf<PObservation> = {
  author: pPersonRelations,
  labels: many({}),
  images: many({}),
  locations: many(pObservationLocationRelations),
};
