import * as t from 'io-ts';
import {
  Serialized,
  tMany,
  Model,
  AsyncPropertiesOf,
  WrapAsync,
  MapOf,
} from '../base';

import { Task, AsyncTask } from '../Task';
import { Building, AsyncBuilding } from '../Building/model';
import { Site, AsyncSite } from '../Site/model';
import { computed, action } from 'mobx';
import { SPOShape, primitive } from '../../utils/spo';
import { UndefinedOrPartialSPO } from '../../utils/spo-observable';

export const Project = t.intersection(
  [
    t.type({
      /**
       * Name of the project
       */
      name: t.string,

      // buildings: t.record(t.string, Building),
      // tasks: t.record(t.string, Task)
      sites: t.record(t.string, Site),
    }),
    t.partial({
      /**
       * Image of the project
       * CDN hash
       */
      $image: t.string,

      // mainSite: Site
    }),
  ],
  'project'
);

export type Project = t.TypeOf<typeof Project>;
export type PartialProject = UndefinedOrPartialSPO<Project>;

const SerializedProject: t.Type<Serialized<Project>> = t.intersection([
  t.type({
    ...Project.types[0].props,
    // buildings: tMany,
    // tasks: tMany
    sites: tMany,
  }),
  t.partial({
    ...Project.types[1].props,
    // mainSite: tOne
  }),
]);

export class ProjectModel extends Model<Project>
  implements AsyncPropertiesOf<Project> {
  @computed
  get name() {
    return this.serialized.name;
  }

  @computed
  get $image() {
    return this.serialized.$image;
  }

  @computed
  get uName() {
    return this.name.toUpperCase();
  }

  // @computed
  // get mainSite() {
  //   return (
  //     this.serialized.mainSite &&
  //     AsyncSite(this.serialized.mainSite)
  //   );
  // }

  @computed
  get sites() {
    return MapOf(AsyncSite, this.serialized.sites);
  }

  // @computed
  // get buildings() {
  //   return SetOf(AsyncBuilding, this.serialized.sites);
  // }

  // @computed
  // get tasks() {
  //   return SetOf(AsyncTask, this.serialized.sites);
  // }
}

export function AsyncProject(obj: SPOShape) {
  return new WrapAsync(obj, SerializedProject, ProjectModel);
}
