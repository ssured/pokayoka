import * as t from 'io-ts';
import {
  Serialized,
  tMany,
  Model,
  AsyncPropertiesOf,
  WrapAsync,
  MapOf,
} from './base';

import { computed, action } from 'mobx';
import { Project, AsyncProject } from './Project/model';
import { generateId } from '../../utils/id';
import { Omit } from '../../utils/typescript';
import { SPOShape } from '../../utils/spo';

export const User = t.intersection(
  [
    t.type({
      /**
       * Name of the user
       */
      name: t.string,

      /**
       * Projects this user has access to
       */
      projects: t.record(t.string, Project),
    }),
    t.partial({
      email: t.string,
    }),
  ],
  'user'
);

export type User = t.TypeOf<typeof User>;
type SerializedUser = Serialized<User>;
const SerializedUser: t.Type<SerializedUser> = t.intersection([
  t.type({
    ...User.types[0].props,
    projects: tMany,
  }),
  t.partial({
    ...User.types[1].props,
  }),
]);

export class UserModel extends Model<User> implements AsyncPropertiesOf<User> {
  @computed
  get name() {
    return this.serialized.name;
  }

  @computed
  get uName() {
    return this.name.toUpperCase();
  }

  @computed
  get email() {
    return this.serialized.email;
  }

  // @computed
  // get mainSite() {
  //   return (
  //     this.serialized.mainSite &&
  //     AsyncSite(this.resolver, this.serialized.mainSite)
  //   );
  // }

  @computed
  get projects() {
    return MapOf(AsyncProject, this.serialized.projects);
  }

  // @computed
  // get buildings() {
  //   return SetOf(AsyncBuilding, this.resolver, this.serialized.sites);
  // }

  // @computed
  // get tasks() {
  //   return SetOf(AsyncTask, this.resolver, this.serialized.sites);
  // }

  @action
  addProject(
    project: Project | Omit<Project, 'sites'>,
    key: string = generateId()
  ) {
    this.serialized.projects[key] = {
      sites: {
        [generateId()]: {
          name: project.name,
          buildings: { [generateId()]: { name: project.name } },
        },
      },
      ...project,
      $image: project.$image || null,
    };
    // if (!project.sites || Object.keys(project.sites).length ===0) {
    //   this.projects.get(key)!.value!.addSite(siteFromProject(project));
    // }
  }
}

export function AsyncUser(obj: SPOShape) {
  return new WrapAsync(obj, SerializedUser, UserModel);
}
