import React from 'react';
import { SpotDB } from '../utils/spotdb';
import { SPOHub } from '../utils/spo-hub';
import { SPOStorage } from '../utils/spo-storage';
import { createObservable } from '../utils/spo-observable';
import { useObserver } from 'mobx-react-lite';
import { autorun, runInAction } from 'mobx';
import { AsyncProject } from './model/Project';

const projectId = 'bk0wb0a7sz';

const spotDb = new SpotDB('pokayoka');
// // @ts-ignore
// window.spot = spotDb;

const hub = new SPOHub();
const storage = new SPOStorage(hub, spotDb);
// const observable = createObservable(hub, ['bk0wb0a7sz']).object;

// setTimeout(
//   () =>
//     runInAction(() => {
//       const [name, count = '0'] = String(observable.name).split('|');
//       observable.name = `${name}|${parseInt(count, 10) + 1}`;
//     }),
//   1000
// );

const project = AsyncProject(
  subj => createObservable(hub, subj).object as any,
  [projectId]
);

// // @ts-ignore
// window.obs = observable;
// console.log({ observable });

// // @ts-ignore
// window.autorun = autorun;

export const SPO: React.FunctionComponent<{}> = ({}) => {
  return useObserver(() => (
    <div>
      <h1>Partial: {project.partial.name}</h1>

      <h1>
        Serialized: {typeof project.serialized}{' '}
        {project.serialized && project.serialized.name}
        {project.value && project.value.uName}
      </h1>
    </div>
  ));
};
