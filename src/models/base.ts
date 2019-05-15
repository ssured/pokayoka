import { action, computed, observable, runInAction, when } from 'mobx';
import { task, TaskStatusAware } from 'mobx-task';
import { computedFn } from 'mobx-utils';
import { deserialize, identifier, serializable, serialize } from 'serializr';
import { generateId as globalGenerateId } from '../utils/id';
import { AllClasses } from './_decycle';

const settings = observable({
  serverUrl: 'http://localhost:5984',
  database: 'atest',
  urlForDocument(id: string) {
    return [this.serverUrl, this.database, id].join('/');
  },
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

  const Class = AllClasses.find(Class => Class.type === type);
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
      object = deserialize(Class as any, data.result);
      object._id = identifier;
      object._rev = data.result._rev;
    });
    return object;
  });
  doc();
  return doc;
}

type AnyClass = (typeof AllClasses)[number];
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

export class Base {
  static type = 'base-must-be-extended';
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
      _id = (this.constructor as typeof Base).generateId(),
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
