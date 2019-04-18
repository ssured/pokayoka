// https://github.com/amark/gun/blob/1fe9daafdeeb55dc41966595c4e848a928a0fa02/src/HAM.js

type timestamp = string;

import { JsonEntry } from './json';
import Lexical from 'fast-json-stable-stringify';

type hamResult =
  | { resolution: 'defer' | 'historical' | 'equal' }
  | { resolution: 'merge'; incoming: boolean; current: boolean };

/* Based on the Hypothetical Amnesia Machine thought experiment */
export function ham(
  machineState: timestamp,
  incomingState: timestamp,
  currentState: timestamp,
  incomingValue: JsonEntry | undefined,
  currentValue: JsonEntry | undefined
): hamResult {
  if (machineState < incomingState) {
    return { resolution: 'defer' }; // the incoming value is outside the boundary of the machine's state, it must be reprocessed in another state.
  }
  if (incomingState < currentState) {
    return { resolution: 'historical' }; // the incoming value is within the boundary of the machine's state, but not within the range.
  }
  if (currentState < incomingState) {
    return { resolution: 'merge', incoming: true, current: false }; // the incoming value is within both the boundary and the range of the machine's state.
  }
  if (incomingState === currentState) {
    const incomingValueString = Lexical(incomingValue) || '';
    const currentValueString = Lexical(currentValue) || '';
    if (incomingValueString === currentValueString) {
      // Note: while these are practically the same, the deltas could be technically different
      return { resolution: 'equal' };
    }
    /*
			The following is a naive implementation, but will always work.
			Never change it unless you have specific needs that absolutely require it.
			If changed, your data will diverge unless you guarantee every peer's algorithm has also been changed to be the same.
			As a result, it is highly discouraged to modify despite the fact that it is naive,
			because convergence (data integrity) is generally more important.
			Any difference in this algorithm must be given a new and different name.
		*/
    if (incomingValueString < currentValueString) {
      // Lexical only works on simple value types!
      return { resolution: 'merge', incoming: false, current: true };
    }
    if (currentValueString < incomingValueString) {
      // Lexical only works on simple value types!
      return { resolution: 'merge', incoming: true, current: false };
    }
  }
  throw new Error(
    `Invalid CRDT Data ${incomingValue} to ${currentValue} at ${incomingState} to ${currentState}!`
  );
}

// same function as above, except that it enforces all event handlers to exist
export const createConvergeFunction = <
  StateType = string,
  DataType extends JsonEntry | undefined = JsonEntry | undefined,
  MetaType = undefined
>(
  getMachineState: (meta: MetaType) => StateType,
  sideEffects: {
    saveFuture: (tuple: [StateType, DataType], meta: MetaType) => void;
    saveHistorical: (tuple: [StateType, DataType], meta: MetaType) => void;
    saveNow: (tuple: [StateType, DataType], meta: MetaType) => void;
    updateLowerBoundary?: (state: StateType, meta: MetaType) => void;
    noop?: (meta: MetaType) => void;
    saveBelowBoundary?: (data: DataType, meta: MetaType) => void;
  },
  lex: (value: DataType) => string = v => JSON.stringify(v) || ''
) =>
  function converge(
    current: [StateType, DataType],
    incoming: [StateType, DataType],
    meta: MetaType
  ): [StateType, DataType] {
    const {
      saveFuture,
      saveHistorical,
      saveNow,
      updateLowerBoundary,
      noop,
      saveBelowBoundary,
    } = Object.assign(
      {
        updateLowerBoundary: () => {},
        noop: () => {},
        saveBelowBoundary: () => {},
      },
      sideEffects
    );

    const Sm = getMachineState(meta);

    const [Sc, Dc] = current;
    const [Si, Di] = incoming;
    switch (true) {
      case Sm < Si:
        saveFuture(incoming, meta);
        return [Sc, Dc];
      case Si < Sc:
        saveHistorical(incoming, meta);
        return [Sc, Dc];
      case Sc < Si:
        saveNow(incoming, meta);
        updateLowerBoundary(Si, meta);
        return [Si, Di];
      case Sc === Si:
        const Lc = lex(Dc);
        const Li = lex(Di);

        switch (true) {
          case Li === Lc:
            noop(meta);
            return [Sc, Dc];
          case Li < Lc:
            saveBelowBoundary(Di, meta);
            return [Sc, Dc];
          case Lc < Li:
            saveNow(incoming, meta);
            saveBelowBoundary(Dc, meta);
            return [Si, Di];
        }
    }
    throw new Error(`Converge error: invalid state`);
  };
