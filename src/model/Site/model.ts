import * as t from 'io-ts';
import { Task, AsyncTask } from '../Task';
import { Building, AsyncBuilding } from '../Building/model';
import {
  Serialized,
  tMany,
  Model,
  AsyncPropertiesOf,
  WrapAsync,
  MapOf,
} from '../base';
import { computed } from 'mobx';
import { SPOShape } from '../../utils/spo';

export const Site = t.intersection(
  [
    t.type({
      name: t.string,
      buildings: t.record(t.string, Building),
    }),
    t.partial({
      tasks: t.record(t.string, Task),
      description: t.string,
    }),
  ],
  'site'
);
export type Site = t.TypeOf<typeof Site>;
type SerializedSite = Serialized<Site>;
const SerializedSite: t.Type<SerializedSite> = t.intersection([
  t.type({
    ...Site.types[0].props,
    buildings: tMany,
  }),
  t.partial({
    ...Site.types[1].props,
    tasks: tMany,
  }),
]);

export class SiteModel extends Model<Site> implements AsyncPropertiesOf<Site> {
  @computed
  get name() {
    return this.serialized.name;
  }

  @computed
  get description() {
    return this.serialized.description;
  }

  @computed
  get buildings() {
    return MapOf(AsyncBuilding, this.serialized.buildings);
  }

  @computed
  get tasks() {
    return MapOf(AsyncTask, this.serialized.tasks || {});
  }
}

export function AsyncSite(obj: SPOShape) {
  return new WrapAsync(obj, SerializedSite, SiteModel);
}
