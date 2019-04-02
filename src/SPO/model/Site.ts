import * as t from 'io-ts';
import { Task, AsyncTask } from './Task';
import { Building, AsyncBuilding } from './Building';
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

export const Site = t.intersection(
  [
    t.type({
      name: t.string,
      buildings: t.record(t.string, Building),
      tasks: t.record(t.string, Task),
    }),
    t.partial({
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
    tasks: tMany,
  }),
  t.partial({
    ...Site.types[1].props,
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
    return SetOf(AsyncBuilding, this.resolver, this.serialized.buildings);
  }

  @computed
  get tasks() {
    return SetOf(AsyncTask, this.resolver, this.serialized.tasks);
  }
}

export function AsyncSite(resolver: Resolver, subj: subj) {
  return new WrapAsync(resolver, subj, SerializedSite, SiteModel);
}
