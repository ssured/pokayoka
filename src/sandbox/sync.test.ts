import pull, { unique, collect, drain, Source, Through } from 'pull-stream';

import levelup from 'levelup';
import memdown from 'memdown';
import encode from 'encoding-down';

import pl from 'pull-level';
import sub from 'subleveldown';
import AutoIndex from 'level-auto-index';
import charwise from 'charwise';

import { types, SnapshotOut, SnapshotIn } from 'mobx-state-tree';
import { HamModel, HAM_PATH, maxStateFromHam } from '../mst-ham/index';
import { HamValue } from '../mst-ham/merge';

import { drainStream } from './pull';
import { createPathProxy, anyProp as idProp } from './typedState/proxy';
import { AbstractGetOptions } from 'abstract-leveldown';

let machineState = Date.now();
const getMachineState = () =>
  (machineState = Math.max(machineState + 1, Date.now()));

describe('sublevel with index', () => {
  const generateId = () =>
    Math.random()
      .toString(36)
      .substr(2, 5);

  const SyncingObject = types
    .model({
      id: types.optional(types.identifier, generateId),
    })
    .actions(self => ({
      afterCreate() {
        // addDisposer(self, () => {

        // })
        console.log(JSON.stringify(self));
      },
    }));

  const Project = types.compose(
    'Project',
    HamModel,
    SyncingObject,
    types
      .model({
        name: types.string,
      })
      .actions(self => ({
        setName(name: string) {
          self.name = name;
        },
      }))
  );

  const env = {
    waitUntilState: (state: number, cb: () => void) =>
      setTimeout(cb, state - Date.now() + 1),
    machineState: getMachineState,
  };

  test('indexes state', async () => {
    const db = levelup(encode<any, any>(memdown()));

    const api = {
      projects: {
        data: {
          [idProp]: (path: string[]) => ({
            get(opts?: AbstractGetOptions) {
              return db.get(path, opts);
            },
          }),
        },
        indexes: {
          byName,
        },
      },
    };

    const dbi = createPathProxy(
      Object.assign((path: string[]) => path, {
        projects: Object.assign((path: string[]) => path, {
          data: Object.assign(
            (path: string[]) => {
              throw null;
            },
            {
              [idProp]: (path: string[]) => JSON.stringify(path),
            }
          ),
          b: Object.assign((path: string[]) => path, {
            c: (path: string[]) => path,
            [idProp]: (path: string[]) => JSON.stringify(path),
          }),
        }),
      })
    );

    console.log(dbi.projects.data['123']());

    const opts = {
      keyEncoding: charwise,
      valueEncoding: 'json',
    };

    const data = sub(db, 'data', opts);

    const idx = {
      machineState: sub(db, 'machineState', {
        ...opts,
        valueEncoding: opts.keyEncoding,
      }),
    };

    const getState = (doc: { id: string; [HAM_PATH]: HamValue }) => {
      return [maxStateFromHam(doc[HAM_PATH]), doc.id];
    };

    const dataByMachineState = AutoIndex(data, idx.machineState, getState);

    const createProject = (snapshot: SnapshotIn<typeof Project>) =>
      Project.create(snapshot, {
        ...env,
        db: data,
        onSnapshot: async (snapshot: SnapshotOut<typeof Project>) => {
          // TODO maybe remove the old index entry here?
          // so we can remove the unique filter from the sync stream
          await new Promise((res, rej) =>
            data.put(snapshot.id, snapshot, (err: any) =>
              err ? rej(err) : res()
            )
          );
          console.log(snapshot);
        },
      });

    const project1 = createProject({ name: 'yo' });
    const project2 = createProject({ name: 'yo' });

    const lastServerSync = getMachineState();

    project1.setName('Sjoerd');
    project1.setName('Test');
    project2.setName('Whazza');

    // read records since last sync state
    const recordsSinceLastSync = await drainStream<{ key: any; value: any }>(
      pl.read(dataByMachineState, { gte: [lastServerSync] }),
      [unique('key')]
    );
    // console.log(recordsSinceLastSync);
    expect(recordsSinceLastSync.length).toBe(2);

    let i = 3;
    const allData = await drainStream(
      pl.read(db),
      [],
      (/*value*/) => (i -= 1) > 0
    );
    expect(allData.length).toBe(3);
    // console.log(allData);
  });
});
