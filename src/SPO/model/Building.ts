import * as t from 'io-ts';
import { Task, AsyncTask } from './Task';
import {
  Serialized,
  tMany,
  Model,
  AsyncPropertiesOf,
  WrapAsync,
  Resolver,
  subj,
  SetOf,
} from './base';
import { computed } from 'mobx';

export const Building = t.intersection(
  [
    t.type({
      name: t.string,
      tasks: t.record(t.string, Task),
    }),
    t.partial({
      description: t.string,
    }),
  ],
  'building'
);
export type Building = t.TypeOf<typeof Building>;
type SerializedBuilding = Serialized<Building>;
const SerializedBuilding: t.Type<SerializedBuilding> = t.intersection([
  t.type({
    ...Building.types[0].props,
    tasks: tMany,
  }),
  t.partial({
    ...Building.types[1].props,
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
    return SetOf(AsyncTask, this.resolver, this.serialized.tasks);
  }
}

export function AsyncBuilding(resolver: Resolver, subj: subj) {
  return new WrapAsync(resolver, subj, SerializedBuilding, BuildingModel);
}
