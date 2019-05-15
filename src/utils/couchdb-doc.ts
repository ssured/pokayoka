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
import { serializable, serialize, identifier, deserialize } from 'serializr';
import { async } from 'q';

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

function rawGet(identifier: string) {
  const [type, id] = identifier.split('-');

  const Class = type === 'project' ? NProject : NUser;

  const doc = task(async () => {
    const data = api.load(identifier);
    await when(() => !data.pending);
    if (data.error) {
      console.error('got loading error', data.error);
      throw data.error;
    }
    let object: any;
    runInAction(() => {
      object = deserialize(Class, data.result);
      object._rev = data.result._rev;
    });
    return object;
  });
  doc();
  return doc;
}
export const getNUser = computedFn(rawGet) as (
  id: string
) => TaskStatusAware<NUser, [string]>;

export class Document {
  static type = 'document';
  static generateId() {
    return `${this.type}-${globalGenerateId()}`;
  }

  @serializable(identifier())
  readonly _id?: string;

  @observable
  _rev?: string;

  constructor() {
    reaction(
      () => this.serialized,
      serialized => {
        // console.log('serialized: ' + JSON.stringify(this.serialized));
        api
          .persist({ _rev: this._rev, ...serialized })
          .then(action(({ ok, rev }) => ok && (this._rev = rev)));
      },
      { fireImmediately: false }
    );
  }

  @computed
  get remote() {
    return api.load(this._id);
  }

  @computed
  get serialized() {
    return serialize(this);
  }
}

export class NUser extends Document {
  static type = 'nuser';

  @serializable
  @observable
  name = '';

  @action setName(name: string) {
    this.name = name;
  }
}

export class NProject extends Document {
  static type = 'nproject';

  @observable
  name = '';
}
