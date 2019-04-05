import mlts from 'monotonic-lexicographic-timestamp';
import { unpack } from 'lexicographic-integer';

export const getMachineState = mlts();

export function stateToMs(state: string) {
  const main = state.split('.')[0];
  return unpack(main);
}
