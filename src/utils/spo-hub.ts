import mlts from 'monotonic-lexicographic-timestamp';
import { state, subj, pred, Tuple } from './spo';

export const getLocalState = mlts() as () => state;

export interface GetMessage {
  subj: subj;
  pred?: pred;
}

export interface StampedGetMessage extends GetMessage {
  type: 'get';
  localState: state;
}

export interface PutMessage {
  tuple: Tuple;
}
export interface StampedPutMessage extends PutMessage {
  type: 'put';
  localState: state;
}

type OutMessage = StampedGetMessage | StampedPutMessage;

type Listener = (msg: OutMessage) => void;

function whenMainThreadAvailable(effect: () => void) {
  setTimeout(effect, 0);
}

export class SPOHub {
  protected listeners: Set<Listener> = new Set();
  protected sources: WeakMap<Listener, unknown> = new WeakMap();

  constructor(public getCurrentState: () => state = getLocalState) {}

  public register(source: unknown, listener: Listener) {
    this.listeners.add(listener);
    this.sources.set(listener, source);

    return () => {
      this.listeners.delete(listener);
    };
  }

  protected fire(outMsg: OutMessage, skipSource?: unknown) {
    whenMainThreadAvailable(() => {
      // console.log('Hub fires', JSON.stringify(outMsg));

      this.listeners.forEach(listener => {
        if (this.sources.get(listener) !== skipSource) {
          listener(outMsg);
        }
      });
    });
  }

  public put(msg: PutMessage, skipSource?: unknown) {
    this.fire(
      { ...msg, type: 'put', localState: getLocalState() } as StampedPutMessage,
      skipSource
    );
  }

  public get(msg: GetMessage, skipSource?: any) {
    this.fire(
      { ...msg, type: 'get', localState: getLocalState() } as StampedGetMessage,
      skipSource
    );
  }
}
