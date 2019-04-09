import {
  SPOShape,
  newRoot,
  subj,
  set as nonSafeSet,
  get as nonSafeGet,
  isLink,
  Tuple,
  isObjt,
  isSPOShape,
  spoInObject,
  pred,
  objt,
  getSubj,
  primitive,
} from './spo';
import { observable, onBecomeObserved, runInAction } from 'mobx';
import { recursiveDeepObserve, IDisposer } from './mobx-deep-observe';
import { SPOHub } from './spo-hub';
import { ham } from './ham';
import { Many, Dictionary } from '../model/base';

const shapeStates = new WeakMap<SPOShape, { [key: string]: string }>();

function keyFromSubjPred(subj: subj, pred: pred) {
  return JSON.stringify([subj, pred]);
}

function updateState(root: SPOShape, tuple: Tuple) {
  const [subj, pred, objt, state] = tuple;

  if (!shapeStates.has(root)) {
    shapeStates.set(root, {});
  }

  shapeStates.get(root)![keyFromSubjPred(subj, pred)] = state;
}

function getState(root: SPOShape, subj: subj, pred: pred) {
  const states = shapeStates.get(root);
  return (states && states[keyFromSubjPred(subj, pred)]) || '';
}

function set(root: SPOShape, tuple: Tuple) {
  updateState(root, tuple);
  const [subj, pred, objt, state] = tuple;
  return runInAction(() => nonSafeSet(root, subj, pred, objt));
}

function get<P>(
  root: SPOShape,
  subj: subj,
  pred?: P
): P extends pred ? objt | SPOShape : SPOShape {
  return runInAction(() => nonSafeGet(root, subj, pred));
}

export type UndefinedOrPartialSPO<T extends SPOShape> = {
  [K in keyof T]: T[K] extends primitive
    ? T[K] | undefined
    : T[K] extends Many<infer U>
    ? Dictionary<undefined | UndefinedOrPartialSPO<U>>
    : T[K] extends SPOShape
    ? UndefinedOrPartialSPO<T[K]>
    : never
};

export function createObservable<T extends SPOShape = SPOShape>(
  hub: SPOHub
): {
  root: UndefinedOrPartialSPO<T>;
  get: (subj: subj) => any;
  destroy: () => void;
} {
  let isUpdating = 0;

  const root = observable(newRoot());

  const disposers: { [key: string]: IDisposer } = {};

  function applyTuple(tuple: Tuple) {
    const [subj, pred, objt, state] = tuple;
    if (!(subj[0] in root)) return;
    // console.log('applyTyple', isUpdating, subj, pred, objt);
    try {
      isUpdating += 1;

      let currentValue = get(root, subj, pred);
      if (isSPOShape(currentValue)) {
        currentValue = getSubj(currentValue);
        if (currentValue === undefined) {
          throw new Error('subj not found for value');
        }
      }

      let doMerge = false;
      if (currentValue === undefined) {
        doMerge = true;
      } else {
        const machineState = hub.getCurrentState();
        const currentState = getState(root, subj, pred);
        const result = ham(
          machineState,
          state,
          currentState,
          objt,
          currentValue
        );
        doMerge = result.resolution === 'merge' && result.incoming;
      }

      if (doMerge) {
        const key = keyFromSubjPred(subj, pred);
        set(root, tuple);

        if (isLink(objt)) {
          // console.log('applyTuple', key);
          if (disposers[key]) disposers[key]();
          disposers[key] = onBecomeObserved(get(root, subj), pred, () => {
            // console.log('onBecomeobserved');
            loadObject(objt);
            disposers[key]();
            delete disposers[key];
          });
        }
      }
    } finally {
      isUpdating -= 1;
    }
  }

  function loadObject(subj: subj): SPOShape {
    if (subj.length === 0) throw new Error(`subj cannot be empty`);
    hub.get({ subj }, root);
    try {
      isUpdating += 1;
      return get(root, subj);
    } finally {
      isUpdating -= 1;
    }
  }

  function commit(tuple: Tuple) {
    hub.put({ tuple }, root);
  }

  const subscription = hub.register(root, msg => {
    // console.log('subscr', msg);
    switch (msg.type) {
      case 'get':
        return;
      case 'put':
        applyTuple(msg.tuple);
    }
  });

  recursiveDeepObserve(root, (change, subj) => {
    if (isUpdating > 0) return; // do not track own changes
    const pred = change.name;
    const state = hub.getCurrentState();

    switch (change.type) {
      case 'remove':
        commit([subj, pred, null, state]);
        break;
      default:
        const objt = change.newValue as unknown;
        if (isObjt(objt)) {
          commit([subj, pred, objt, state]);
        } else if (isSPOShape(objt)) {
          for (const tuple of spoInObject(subj.concat(pred), objt, state)) {
            commit(tuple);
            applyTuple(tuple); // ? not needed?
          }
        }
    }
  });

  return {
    root: root as any,
    get: loadObject,
    destroy: () => {
      subscription();
      Object.values(disposers).forEach(dispose => dispose());
    },
  };
}

// public async commit(data: Map<subj, SPOShape | [SPOShape, state]>) {
//     const tx = (await this.db).transaction(this.objectStoreName, 'readwrite');
//    const tuples: Tuple[] = [];

//   for (const [subj, objOrObjWithState] of data.entries()) {
//     let obj: SPOShape;
//     let state: state;
//     if (Array.isArray(objOrObjWithState)) {
//       [obj, state] = objOrObjWithState;
//     } else {
//       obj = objOrObjWithState;
//       state = this.dbState();
//     }
//     for (const tuple of spoInObject(subj, obj)) {
//       tuples.push(tuple);
//       const object = objectFromTuple(tuple, state, this.dbState());
//       tx.store.put(object);
//     }
//   }

//   await tx.done;

//   // expose all written tuples to live listeners
//   this.committedTuples.fire(tuples);

//   return;
// }
