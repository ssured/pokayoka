import { One, Many } from './base';

declare global {
  type PYLocation = {
    '@type': 'PYLocation';
  } & (
    | {
        locationType: 'sheet';
        sheet: One<Sheet>;
        x: number;
        y: number;
      }
    | {
        locationType: 'element';
        element: One<PProject | PSite | PBuilding | PBuildingStorey>;
      });

  type Observation = {
    '@type': 'Observation';
    identifier: string;

    name: string;
    description?: string;

    author: One<Person>;

    labels: Record<string, string>; // set of labels
    images: Record<string, string>; // set of hashes
    locations: Many<PYLocation>;
  };
}
