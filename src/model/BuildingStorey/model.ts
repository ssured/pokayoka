import * as t from 'io-ts';
import { Task, AsyncTask } from '../Task';
import {
  Serialized,
  tMany,
  Model,
  AsyncPropertiesOf,
  WrapAsync,
  MapOf,
} from '../base';
import { computed, action } from 'mobx';
import { SPOShape } from '../../utils/spo';
import { Sheet, AsyncSheet } from '../Sheet/model';
import { generateId } from '../../utils/id';

export const BuildingStorey = t.intersection(
  [
    t.type({
      name: t.string,
    }),
    t.partial({
      description: t.string,
      tasks: t.record(t.string, Task),
      sheets: t.record(t.string, Sheet),
    }),
  ],
  'buildingStorey'
);
export type BuildingStorey = t.TypeOf<typeof BuildingStorey>;
type SerializedBuildingStorey = Serialized<BuildingStorey>;
const SerializedBuildingStorey: t.Type<
  SerializedBuildingStorey
> = t.intersection([
  t.type({
    ...BuildingStorey.types[0].props,
  }),
  t.partial({
    ...BuildingStorey.types[1].props,
    tasks: tMany,
    sheets: tMany,
  }),
]);

export class BuildingStoreyModel extends Model<BuildingStorey>
  implements AsyncPropertiesOf<BuildingStorey> {
  @computed
  get name() {
    return this.serialized.name;
  }

  @computed
  get description() {
    return this.serialized.description;
  }

  @computed
  get tasks() {
    return MapOf(AsyncTask, this.serialized.tasks || {});
  }

  @computed
  get sheets() {
    return MapOf(AsyncSheet, this.serialized.sheets || {});
  }

  @action
  addSheet(sheet: Sheet, key: string = generateId()) {
    this.serialized.sheets = this.serialized.sheets || {};
    this.serialized.sheets[key] = sheet;
  }
}

export function AsyncBuildingStorey(obj: SPOShape) {
  return new WrapAsync(obj, SerializedBuildingStorey, BuildingStoreyModel);
}
