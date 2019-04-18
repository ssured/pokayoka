import charwise from 'charwise';
import dlv from 'dlv';
import { createConvergeFunction } from './ham';
import { ensureNever } from './index';
import { isObjt, objt, pred, RawSPOShape, SPOShape, subj } from './spo';
import { SPOHub } from './spo-hub';
import { createUniverse, m, ThunkTo } from './universe';

const pathToKey = charwise.encode;

export function createObservable<T extends SPOShape = SPOShape>(
  hub: SPOHub
): ThunkTo<T> {
  type state = string;
  type SubjMeta = {
    states: Record<string, state>;
    setValue: (value: RawSPOShape) => void;
  };

  const inSync = false;

  const subjMeta: Record<string, SubjMeta> = {};

  // merge data into this observable, respecting HAM
  const mergeTuple = ([Si, Di]: [state, objt], [subj, pred]: [subj, pred]) => {
    const meta = subjMeta[pathToKey(subj)];
    if (meta == null) return; // ignore because we do not know this subject

    const Sc = meta.states[pred] || '';

    // FIXME: expose current value as helper function of universe library
    const Dc = (m(dlv<any>(root(), subj)) || {})[pred] || null;

    converge([Sc, Dc], [Si, Di], [subj, pred]);
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
        const meta = subjMeta[pathToKey(subj)];
        if (meta == null) throw new Error('no meta available');
        meta.states[pred] = state;
        meta.setValue({ [pred]: data });
      },
    }
  );

  // create the main root
  const root = createUniverse<T>({
    resolve: (subj, setValue) => {
      console.log('resolve', subj);
      subjMeta[pathToKey(subj)] = { states: {}, setValue };

      return {
        onActive: () => {
          if (!inSync) {
            hub.get({ subj }, root);
          }
        },
      };
    },
    updateListener: function updateListener(subj, value) {
      const meta = subjMeta[pathToKey(subj)];
      if (meta == null) throw new Error('no meta available');

      for (const [pred, objt] of Object.entries(value)) {
        if (isObjt(objt)) {
          const state = hub.getCurrentState();
          meta.states[pred] = state;
          hub.put({ tuple: [subj, pred, objt, state] }, root);
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
