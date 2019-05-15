import { action, computed, observable } from 'mobx';
import { list, primitive, serializable } from 'serializr';
import { getDoc, Project, Base } from './_decycle';

export class User extends Base {
  static type = 'nuser';

  /**
   * Name of the user
   */
  @serializable
  @observable
  name = '';

  @action
  setName(name: string) {
    this.name = name;
  }

  /**
   * Which project is currently selected
   */
  @serializable
  @observable
  selectedProject: string | null = null;

  @computed
  get selectedProject$() {
    return this.selectedProject && getDoc<Project>(this.selectedProject);
  }

  @action
  selectProject(project: Project | null) {
    this.selectedProject = project && project._id;
  }

  /**
   * All projects the user knows of
   */
  @serializable(list(primitive()))
  @observable
  projects: string[] = [];

  @computed
  get projects$() {
    return this.projects.map(project => getDoc<Project>(project));
  }

  @action
  addProject(project: Project) {
    const idx = this.projects.indexOf(project._id);
    if (idx === -1) {
      this.projects.push(project._id);
    }
  }

  @action
  removeProject(project: Project) {
    const idx = this.projects.indexOf(project._id);
    if (idx > -1) {
      this.projects.splice(idx, 1);
    }
  }
}
