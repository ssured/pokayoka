import {
  types,
  addDisposer,
  IAnyComplexType,
  getEnv,
  onPatch,
  getSnapshot,
  applySnapshot,
  splitJsonPath,
  Instance,
  getRoot,
  isStateTreeNode,
  getType,
  typecheck,
} from 'mobx-state-tree';
import { get, set, entries } from 'mobx';
import { merge, HamValue, isObject } from './merge';

const hamType: IAnyComplexType = types.map(
  types.union(
    types.number,
    types.array(types.union(types.number, types.late(() => hamType)))
  )
);

type THam = { [key: string]: number | [number, THam] };

export const HAM_PATH = '#';

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

function initHam(state: number, obj: any): HamValue {
  if (isObject(obj)) {
    const ham: HamValue = [state, {}];
    for (const [key, value] of entries(obj)) {
      if (key === HAM_PATH) continue;
      ham[1][key] = initHam(state, value);
    }
    return ham;
  }
  return state;
}

export const hamProperties = {
  '#': types.maybe(types.array(types.union(types.number, hamType))), // [HAM_PATH]
};

const _HamModel = types.model('HamModel', hamProperties);

const notifyChange = (self: Instance<typeof _HamModel>) => {
  const root = getRoot<any>(self);
  if (typeof root.notifyHamChange === 'function') {
    root.notifyHamChange(self);
  }
};

export const hamActions = (self: Instance<typeof _HamModel>) => {
  const {
    waitUntilState = (state, cb) => setTimeout(cb, state - Date.now() + 1),
    machineState = () => Date.now(),
  }: {
    waitUntilState: (state: number, callback: () => void) => void;
    machineState: () => number;
  } = getEnv(self);

  let isMerging = 0;

  const updateHam = (state: number, path: string[], prop: string) => {
    const ham = hamDlv(get(self, HAM_PATH)[1], state, path);
    set(ham, prop, state);
  };

  return {
    updateHam,
    afterCreate() {
      if (self[HAM_PATH] == null) {
        set(self, HAM_PATH, initHam(machineState(), self));
      }
      addDisposer(
        self,
        onPatch(self, patch => {
          const path = splitJsonPath(patch.path);

          if (isMerging > 0 || path[0] === HAM_PATH) {
            return;
          }

          const prop = path.pop()!;
          ((self as any).updateHam as typeof updateHam)(
            machineState(),
            path,
            prop
          );

          notifyChange(self);
        })
      );
    },
    merge(incoming: any) {
      try {
        isMerging += 1;
        const { [HAM_PATH]: inHam, ...inValue } = isStateTreeNode(incoming)
          ? getSnapshot(incoming)
          : incoming;
        const { [HAM_PATH]: curHam, ...curValue } = getSnapshot(self);

        const result = merge(
          machineState(),
          inHam,
          inValue,
          curHam as HamValue,
          curValue
        );

        if (result.currentChanged) {
          try {
            const newSnapshot = {
              ...result.resultValue,
              [HAM_PATH]: result.resultHam,
            };
            if (getType(self).is(newSnapshot)) {
              applySnapshot(self, newSnapshot);
            } else {
              try {
                typecheck(getType(self), newSnapshot);
              } catch (errors) {
                console.log(errors);
                debugger;
              }
            }
          } catch (e) {
            console.error(e);
            debugger;
          }
          // console.log('hier2', {
          //   inHam,
          //   inValue,
          //   curHam,
          //   curValue,
          //   result: {
          //     ...result.resultValue,
          //     [HAM_PATH]: result.resultHam,
          //   },
          // });
          notifyChange(self);
        }
        if (result.deferUntilState != null) {
          waitUntilState(result.deferUntilState, () =>
            (self as any).merge(incoming)
          );
        }
        isMerging -= 1;
      } catch (e) {
        isMerging -= 1;
        throw e;
      }
    },
  };
};

export const HamModel = _HamModel.actions(hamActions);
