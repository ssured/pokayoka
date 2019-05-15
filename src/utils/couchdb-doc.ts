import {
  observable,
  computed,
  when,
  action,
  autorun,
  reaction,
  runInAction,
} from 'mobx';
import { computedFn } from 'mobx-utils';
import { task, TaskStatusAware } from 'mobx-task';
import { generateId as globalGenerateId } from './id';
import {
  serializable,
  serialize,
  identifier,
  deserialize,
  list,
  reference,
  primitive,
} from 'serializr';
import { async, all } from 'q';
import { conditionalExpression } from '@babel/types';
import { VoidC } from 'io-ts';
import { merge } from './object-crdt';

const settings = observable({
  serverUrl: 'http://localhost:5984',
  database: 'atest',
  urlForDocument(id: string) {
    return [this.serverUrl, this.database, id].join('/');
  },
});

const getJson = task(async (url: string) => {
  const data = await fetch(url);
  return data.json();
});

const putJson = task(async (url: string, body: any) => {
  const rawResponse = await fetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return await rawResponse.json();
});

const api = observable({
  load: computedFn((id: string) => {
    const job = task(async () => {
      const url = settings.urlForDocument(id);
      console.log(`fetching ${url}`);
      const data = await fetch(url);
      const json = await data.json();
      return json;
    });
    job();
    return job;
  }),
  persist: (serialized: any) => {
    return putJson(settings.urlForDocument(serialized._id), serialized);
  },
});

const allDocs = observable.map<string, AnyInstance>();

function rawGet(identifier: string) {
  const [type] = identifier.split('-');

  const Class = Classes.find(Class => Class.type === type);
  if (Class == null) {
    throw new Error(`Cannot find class for id: ${identifier}`);
  }

  const doc = task(async () => {
    if (allDocs.has(identifier)) {
      return allDocs.get(identifier)!;
    }
    const data = api.load(identifier);
    await when(() => !data.pending);
    // protect against race conditions
    if (allDocs.has(identifier)) {
      return allDocs.get(identifier)!;
    }
    if (data.error) {
      console.error('got loading error', data.error);
      throw data.error;
    }
    let object: any;
    runInAction(() => {
      object = deserialize(Class, data.result);
      object._id = identifier;
      object._rev = data.result._rev;
    });
    return object;
  });
  doc();
  return doc;
}

type AnyClass = (typeof Classes)[number];
type AnyInstance = InstanceType<AnyClass>;
type DocShape = {
  _id?: string;
  _rev?: string;
  [key: string]: undefined | null | boolean | number | string | string[];
};

export const getDoc = computedFn(rawGet) as <
  T extends AnyInstance = AnyInstance
>(
  id: string
) => TaskStatusAware<T, [string]>;

export class Document {
  static type = 'document';
  static generateId() {
    return `${this.type}-${globalGenerateId()}`;
  }

  @serializable(identifier())
  @observable
  readonly _id: string;

  @observable
  _rev?: string;

  constructor(props: DocShape = {}) {
    const {
      _id = (this.constructor as typeof Document).generateId(),
      ...other
    } = props;
    this._id = _id;
    this.merge(props);

    runInAction(() => {
      allDocs.set(this._id, this as any);
    });
  }

  @action
  merge(props: DocShape) {
    Object.assign(this, props);
  }

  @computed
  get remote() {
    return api.load(this._id);
  }

  @computed
  get serialized() {
    return serialize(this);
  }

  persist() {
    return api
      .persist({ _rev: this._rev, ...this.serialized })
      .then(action(({ ok, rev }) => ok && (this._rev = rev)));
  }
}

export class NProject extends Document {
  static type = 'nproject';

  @serializable
  @observable
  name = '';

  @action
  setName(name: string) {
    this.name = name;
  }
}

// const findNProject = async (
//   id: string,
//   callback: (err: any, value: any) => void
// ) => {
//   console.log('findNProject', id);
//   const project = getNProject(id);
//   await when(() => !project.pending);
//   runInAction(() => callback(project.error || null, project.result));
// };

export class NUser extends Document {
  static type = 'nuser';

  @serializable
  @observable
  name = '';

  @action
  setName(name: string) {
    this.name = name;
  }

  @serializable
  @observable
  selectedProject: string | null = null;

  @computed
  get selectedProject$() {
    return this.selectedProject && getDoc<NProject>(this.selectedProject);
  }

  @action
  selectProject(project: NProject | null) {
    this.selectedProject = project && project._id;
  }

  @serializable(list(primitive()))
  @observable
  projects: string[] = [];

  @computed
  get projects$() {
    return this.projects.map(project => getDoc<NProject>(project));
  }

  @action
  addProject(project: NProject) {
    const idx = this.projects.indexOf(project._id);
    if (idx === -1) {
      this.projects.push(project._id);
    }
  }

  @action
  removeProject(project: NProject) {
    const idx = this.projects.indexOf(project._id);
    if (idx > -1) {
      this.projects.splice(idx, 1);
    }
  }
}

const Classes = [NProject, NUser] as [typeof NProject, typeof NUser];
