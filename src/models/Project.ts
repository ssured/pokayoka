import { action, observable } from 'mobx';
import { serializable } from 'serializr';
import { Base } from './_decycle';

export class Project extends Base {
  static type = 'nproject';

  @serializable
  @observable
  name = '';

  @action
  setName(name: string) {
    this.name = name;
  }
}
