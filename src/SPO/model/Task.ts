import * as t from 'io-ts';
import {
  Serialized,
  tMany,
  Model,
  AsyncPropertiesOf,
  WrapAsync,
  SPOShape,
} from './base';
import { computed } from 'mobx';

export const Task = t.intersection(
  [
    t.type({
      name: t.string,
    }),
    t.partial({
      deliverable: t.string,
    }),
  ],
  'task'
);
export type Task = t.TypeOf<typeof Task>;
type SerializedTask = Serialized<Task>;
const SerializedTask: t.Type<SerializedTask> = t.intersection([
  t.type({
    ...Task.types[0].props,
  }),
  t.partial({
    ...Task.types[1].props,
  }),
]);

export class TaskModel extends Model<Task> implements AsyncPropertiesOf<Task> {
  @computed
  get name() {
    return this.serialized.name;
  }
  @computed
  get deliverable() {
    return this.serialized.deliverable;
  }
}

export function AsyncTask(obj: SPOShape) {
  return new WrapAsync(obj, SerializedTask, TaskModel);
}
