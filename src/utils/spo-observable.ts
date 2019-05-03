import charwise from 'charwise';
import dlv from 'dlv';
import dset from 'dset';
import { RelationsOf } from '../model/base';
import { createConvergeFunction } from './ham';
import { ensureNever } from './index';
import { isObjt, objt, pred, SPOShape, subj } from './spo';
import { SPOHub } from './spo-hub';
import { createUniverse, getPath, Maybe, ThunkTo } from './universe';

const pathToKey = charwise.encode;
// @ts-ignore
window.charwise = charwise;

type RequestedMap = { [key: string]: boolean | RequestedMap };

export function createObservable<T extends SPOShape = SPOShape>(
  hub: SPOHub,
  runtimeShape: RelationsOf<T>
): ThunkTo<T> {
  type state = string;
  type SubjStateMap = Record<string, state>;

  const requested: RequestedMap = {};

  function request(subj: subj) {
    // if a more generic subject was already requested, ignore the request
    try {
      dset(requested, subj, true);
      // console.log('spo-observable get', subj);
      hub.get({ subj }, root);
    } catch (e) {
      if (e.message.match(/^cannot create property/i) == null) {
        throw e;
      }
    }
  }

  const subjStates: Record<string, SubjStateMap> = {};

  const getStateMap = (subj: subj): SubjStateMap =>
    subjStates[pathToKey(subj)] || (subjStates[pathToKey(subj)] = {});

  // merge data into this observable, respecting HAM
  const mergeTuple = ([Si, Di]: [state, objt], [subj, pred]: [subj, pred]) => {
    const states = getStateMap(subj);

    const Sc = states[pred] || '';

    // FIXME: expose current value as helper function of universe library
    const Dc = ((dlv<Maybe<SPOShape>>(root(), subj) || {})[pred] ||
      null) as objt;

    const result = converge([Sc, Dc], [Si, Di], [subj, pred]);

    // console.log('spo-observable merge', subj, pred, result);
  };

  const converge = createConvergeFunction<state, objt, [subj, pred]>(
    hub.getCurrentState,
    {
      saveFuture: (incoming, meta) => {
        const waitMs = 5000; // FIXME implement calculation msFromNow(incomingState)
        setTimeout(() => mergeTuple(incoming, meta), waitMs);
      },
      saveHistorical: () => {},
      saveNow: ([state, data], [subj, pred]) => {
        const states = getStateMap(subj);
        states[pred] = state;
        // console.log(
        //   `saveNow ${subj.join('/')} ${pred} = ${JSON.stringify(data)}`
        // );
        set(subj, false, { [pred]: data });
      },
    }
  );

  // create the main root
  const { root, set /*, get*/ } = createUniverse<T>({
    runtimeShape,
    resolve: subj => {
      subjStates[pathToKey(subj)] = {
        ...(subjStates[pathToKey(subj)] || { states: {} }),
      };

      return {
        onActive: () => {
          request(subj);
        },
      };
    },
    updateListener: function updateListener(subj, value) {
      const states = getStateMap(subj);

      for (const [pred, objtOrReferencedValue] of Object.entries(value)) {
        // check if the object is a reference, if so, use its path as objt
        const objt = getPath(objtOrReferencedValue) || objtOrReferencedValue;

        if (isObjt(objt)) {
          const state = hub.getCurrentState();
          states[pred] = state;
          hub.put(
            { tuple: [subj, pred, objt == null ? null : objt, state] },
            root
          );
        } else {
          updateListener(subj.concat(pred), objt);
        }
      }
    },
    pathToKey,
  });

  hub.register(root, async msg => {
    switch (msg.type) {
      case 'put': {
        const {
          tuple: [subj, pred, Di, Si],
        } = msg;
        mergeTuple([Si, Di], [subj, pred]);

        break;
      }
      case 'get': {
        // ignored as runtime is not a data store
        break;
      }
      default:
        ensureNever(msg);
    }
  });

  return root;
}
