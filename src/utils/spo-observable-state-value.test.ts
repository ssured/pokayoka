import {
  IObservableArray,
  observable,
  ObservableMap,
  observe,
  action,
  runInAction,
} from 'mobx';
import { primitive } from './spo';

type state = string;
type objt = string | null;
type stateValue = Dictionary<objt>;

const descending = (a: string, b: string) => (a < b ? 1 : -1);
const lex = JSON.stringify;

class StateBox {
  private values: ObservableMap<state, objt>;
  private states: IObservableArray<string>;
  public destroy: () => void;

  constructor(public state: () => state, initialValue: stateValue = {}) {
    this.values = observable.map(initialValue, { deep: false });
    this.states = observable.array(Object.keys(initialValue).sort(descending));

    this.destroy = observe(this.values, change => {
      runInAction(() => {
        switch (change.type) {
          case 'add': {
            const idx = this.states.findIndex(k => k < change.name);
            this.states.splice(Math.max(0, idx), 0, change.name);
            break;
          }
          case 'delete': {
            const idx = this.states.findIndex(k => k === change.name);
            if (idx > -1) {
              this.states.splice(idx, 1);
            }
            break;
          }
        }
      });
    });
  }

  @action
  merge(state: state, objt: objt) {
    if (!this.values.has(state) || lex(this.values.get(state)) < lex(objt)) {
      this.values.set(state, objt);
    }
  }

  @action
  set(objt: objt) {
    this.merge(this.state(), objt);
  }

  private localState(state: state): state {
    return this.states.find(k => k <= state) || '';
  }
  private get currentKey(): state {
    return this.localState(this.state());
  }

  get(state?: state): objt {
    const key = state ? this.localState(state) : this.currentKey;
    return key !== '' ? this.values.get(key)! : null;
  }

  @action
  clearHistory() {
    this.states
      .filter(key => key < this.currentKey)
      .forEach(key => this.values.delete(key));
  }

  // @action
  // clearFuture() {
  //   const state = this.state();
  //   for (const key of this.keys.filter(key => key > state)) {
  //     this.merge(key, null);
  //   }
  // }
}

describe('nested state keyed objects', () => {
  test('initial', () => {
    const state = observable.box<state>('1');
    const getState = () => state.get();

    const value = new StateBox(getState, {
      1: 'one',
      2: 'two',
      4: 'four',
    });

    expect(value.get()).toEqual('one');

    state.set('2');
    expect(value.get()).toEqual('two');

    state.set('3');
    expect(value.get()).toEqual('two');

    value.merge('3', 'thre');
    value.set('three');
    value.merge('3', 'thre');
    expect(value.get()).toEqual('three');

    value.merge('3', null);
    expect(value.get()).toEqual(null);

    state.set('4');
    expect(value.get()).toEqual('four');
    expect(value.get('3')).toEqual(null);

    value.set(null);
    expect(value.get()).toEqual(null);

    // expect(value.size).toBe(3);
    value.clearHistory();
    // expect(value.size).toBe(1);
  });
});
