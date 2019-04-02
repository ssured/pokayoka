import * as t from 'io-ts';
import {
  Serialized,
  tMany,
  Model,
  AsyncPropertiesOf,
  WrapAsync,
  MapOf,
  SPOShape,
} from './base';

import { Task, AsyncTask } from './Task';
import { Building, AsyncBuilding } from './Building';
import { Site, AsyncSite } from './Site';
import { computed } from 'mobx';

export const Project = t.intersection(
  [
    t.type({
      /**
       * Name of the project
       */
      name: t.string,

      // buildings: t.record(t.string, Building),
      // tasks: t.record(t.string, Task)
    }),
    t.partial({
      // mainSite: Site
      sites: t.record(t.string, Site),
    }),
  ],
  'project'
);

export type Project = t.TypeOf<typeof Project>;
type SerializedProject = Serialized<Project>;
const SerializedProject: t.Type<SerializedProject> = t.intersection([
  t.type({
    ...Project.types[0].props,
    // buildings: tMany,
    // tasks: tMany
  }),
  t.partial({
    ...Project.types[1].props,
    sites: tMany,
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
    return MapOf(AsyncSite, this.serialized.sites || {});
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
