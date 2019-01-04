import {
  IObservableObject,
  isObservableObject,
  observable,
  transaction,
  runInAction,
  set,
  get,
  entries,
} from 'mobx';

import { deepObserve } from './deep-observe';

type THam = { [key: string]: number | [number, THam] };

interface IHamObject {
  _ham: THam;
}

const observables = new WeakMap<object, IObservableObject>();
export function getDeepObservable<T extends object>(o: T) {
  if (!observables.has(o)) {
    observables.set(o, observable.object(o, {}, { deep: true }));
  }
  return observables.get(o)! as T & IObservableObject;
}

function appendToHam(ham: THam, prop: string, object: any, state: number) {
  if (isObservableObject(object)) {
    set(ham, prop, [state, {}]);
    for (const [key, value] of entries(object)) {
      // do not simplify the statements in this block
      // order does something with the mobx administration, probably because of deep observability
      appendToHam((get(ham, prop) as [number, THam])[1], key, value, state);
    }
  } else {
    console.log(ham);
    console.log(prop);
    set(ham, prop, state);
  }
}

const hamDlv = (_ham: THam, state: number, path: string[]): THam => {
  let ham = _ham;
  for (const prop of path) {
    const sub = get(ham, prop);
    if (typeof sub === 'number' || typeof sub === 'undefined') {
      // do not simplify the statements in this block
      // order does something with the mobx administration, probably because of deep observability
      set(ham, prop, [sub || state, {}]);
      ham = (get(ham, prop) as [number, THam])[1];
    } else {
      ham = Array.isArray(sub) ? sub[1] : sub;
    }
  }
  return ham;
};

export const hamObject = <T extends object>(
  source: T,
  getMachineState: () => number = () => Date.now()
) => {
  const obj = (isObservableObject(source)
    ? source
    : getDeepObservable(source)) as T & IObservableObject & IHamObject;

  if (get(obj, '_ham') == null) {
    runInAction(() => set(obj, '_ham', {}));
  }

  const dispose = deepObserve(obj, (change, path) =>
    transaction(() => {
      if ((path.length === 0 ? change.name : path[0]) === '_ham') return;

      const machineState = getMachineState();
      const ham = hamDlv(obj._ham, machineState, path);

      switch (change.type) {
        case 'add':
        case 'update':
          appendToHam(ham, change.name, change.newValue, machineState);
          break;
        case 'remove':
        case 'delete':
          ham[change.name] = machineState;
          break;
      }
    })
  );

  return {
    obj,
    dispose,
  };
};
