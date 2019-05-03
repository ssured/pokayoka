import { SPOHub, StampedGetMessage, StampedPutMessage } from './spo-hub';
import { ham } from './ham';
import dlv from 'dlv';
import { objt, state, subj } from './spo';
import dset from 'dset';

export class SPOMemStorage {
  private disposer: () => void;
  public data: any = {};

  constructor(protected hub: SPOHub) {
    this.disposer = hub.register(this, msg => {
      // @ts-ignore
      this[msg.type](msg);
    });
  }

  protected async get(msg: StampedGetMessage) {
    const { subj, pred } = msg;
    if (pred) {
      const [objt, state]: [objt, state] =
        dlv(this.data, subj.concat(pred)) || ([] as any);
      if (objt) {
        this.hub.put({ tuple: [subj, pred, objt, state] }, this);
      }
      return;
    }

    const walk = (subj: subj) => {
      const value = dlv(this.data, subj) || {};

      if (value && typeof value === 'object') {
        Object.entries(value).forEach(([pred, val]) => {
          if (Array.isArray(val)) {
            const [objt, state] = val as [objt, state];
            this.hub.put({ tuple: [subj, pred, objt, state] }, this);
          } else if (val && typeof val === 'object') {
            walk(subj.concat(pred));
          }
        });
      }
    };

    walk(subj);
  }

  protected async put(msg: StampedPutMessage) {
    const [subj, pred, incomingValue, incomingState] = msg.tuple;
    const [currentValue = undefined, currentState = ''] =
      dlv(this.data, subj.concat(pred)) || ([] as any);
    const machineState = msg.localState;

    const result = ham(
      machineState,
      incomingState,
      currentState,
      incomingValue,
      currentValue
    );

    if (result.resolution === 'merge' && result.incoming) {
      dset(this.data, subj.concat(pred), [incomingValue, incomingState]);
    }
  }

  public destroy() {
    this.disposer();
  }
}
