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
} from './spo';
import { observable, onBecomeObserved, runInAction } from 'mobx';
import { recursiveDeepObserve, IDisposer } from './mobx-deep-observe';
import { SPOHub } from './spo-hub';

function set(root: SPOShape, subj: subj, pred: pred, objt: objt) {
  return runInAction(() => nonSafeSet(root, subj, pred, objt));
}

function get<P>(
  root: SPOShape,
  subj: subj,
  pred?: P
): P extends pred ? objt | SPOShape : SPOShape {
  return runInAction(() => nonSafeGet(root, subj, pred));
}

export function createObservable(
  hub: SPOHub,
  subj: subj
): {
  get: (subj: subj) => SPOShape;
  destroy: () => void;
} {
  console.log('createObservable', subj);

  let isUpdating = 0;

  const root = observable(newRoot());

  const disposers: { [key: string]: IDisposer } = {};

  function applyTuple([subj, pred, objt]: Tuple) {
    if (!(subj[0] in root)) return;
    console.log('applyTyple', isUpdating, subj, pred, objt);
    try {
      isUpdating += 1;

      if (get(root, subj, pred) === objt) return;
      set(root, subj, pred, objt);

      if (isLink(objt)) {
        const key = JSON.stringify([subj, pred]);
        console.log('applyTuple', key);
        if (disposers[key]) disposers[key]();
        disposers[key] = onBecomeObserved(get(root, subj), pred, () => {
          console.log('onBecomeobserved');
          loadObject(objt);
          disposers[key]();
          delete disposers[key];
        });
      }
    } finally {
      isUpdating -= 1;
    }
  }

  function loadObject(subj: subj): SPOShape {
    if (subj.length === 0) throw new Error(`subj cannot be empty`);
    hub.get({ subj }, root);
    return get(root, subj);
  }

  function commit(tuple: Tuple) {
    hub.put({ tuple }, root);
  }

  const subscription = hub.register(root, msg => {
    console.log('subscr', msg);
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

    switch (change.type) {
      case 'remove':
        commit([subj, pred, null]);
        break;
      default:
        const objt = change.newValue as unknown;
        if (isObjt(objt)) {
          commit([subj, pred, objt]);
        } else if (isSPOShape(objt)) {
          for (const tuple of Array.from(spoInObject(subj, objt))) {
            commit(tuple);
            applyTuple(tuple);
          }
        }
    }
  });

  return {
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
