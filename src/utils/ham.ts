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
