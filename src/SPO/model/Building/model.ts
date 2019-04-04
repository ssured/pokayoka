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
import { computed } from 'mobx';
import { SPOShape } from '../../../utils/spo';
import { BuildingStorey, AsyncBuildingStorey } from '../BuildingStorey/model';

export const Building = t.intersection(
  [
    t.type({
      name: t.string,
    }),
    t.partial({
      description: t.string,
      tasks: t.record(t.string, Task),
      buildingStoreys: t.record(t.string, BuildingStorey),
    }),
  ],
  'building'
);
export type Building = t.TypeOf<typeof Building>;
type SerializedBuilding = Serialized<Building>;
const SerializedBuilding: t.Type<SerializedBuilding> = t.intersection([
  t.type({
    ...Building.types[0].props,
  }),
  t.partial({
    ...Building.types[1].props,
    tasks: tMany,
    buildingStoreys: tMany,
  }),
]);

export class BuildingModel extends Model<Building>
  implements AsyncPropertiesOf<Building> {
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
  get buildingStoreys() {
    return MapOf(AsyncBuildingStorey, this.serialized.buildingStoreys || {});
  }
}

export function AsyncBuilding(obj: SPOShape) {
  return new WrapAsync(obj, SerializedBuilding, BuildingModel);
}
