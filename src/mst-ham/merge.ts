import { entries } from 'mobx';

export type THam = { [key: string]: number | [number, THam] };
export type HamValue = THam['any'];
const EMPTY_HAM_STATE = -1;

const clone = <T extends any>(o: T): T => {
  const s = JSON.stringify(o);
  return s ? JSON.parse(s) : undefined;
};

export const isObject = (x: any): x is object =>
  (typeof x === 'object' && x !== null) || typeof x === 'function';

function stateFromHam(ham: HamValue | undefined): number {
  return ham === undefined ? 0 : typeof ham === 'number' ? ham : ham[0];
}

export function merge(
  machineState: number,
  incomingHam: HamValue,
  incomingValue: any,
  currentHam: HamValue,
  currentValue: any
): {
  resultHam: HamValue;
  resultValue: any;
  currentChanged: boolean;
  deferUntilState?: number;
} {
  const incomingState = stateFromHam(incomingHam);

  // console.log(machineState);
  // console.log(incomingState);
  // console.log(incomingValue);
  // console.log(stateFromHam(currentHam));
  // console.log(currentValue);

  if (machineState < incomingState) {
    // defer
    // the incoming value is outside the boundary of the machine's state, it must be reprocessed in another state.
    return {
      resultHam: currentHam,
      resultValue: currentValue,
      currentChanged: false,
      deferUntilState: incomingState,
    };
  }

  const currentState = stateFromHam(currentHam);

  if (incomingState < currentState) {
    // historical
    // the incoming value is within the boundary of the machine's state, but not within the range.
    return {
      resultHam: currentHam,
      resultValue: currentValue,
      currentChanged: false,
    };
  }

  // if incoming is an object, compare deeper
  // objects are more important than primitives
  if (Array.isArray(incomingHam) && isObject(incomingValue)) {
    const currentIsObject = isObject(currentValue);

    const resultHam: [number, THam] = currentIsObject
      ? typeof currentHam === 'number'
        ? [
            currentHam,
            Object.keys(currentValue).reduce(
              (map, key) => {
                map[key] = currentHam;
                return map;
              },
              {} as THam
            ),
          ]
        : clone(currentHam as [number, THam])
      : [0, {}];

    const replace = stateFromHam(incomingHam) > stateFromHam(currentHam);
    if (replace) resultHam[0] = stateFromHam(incomingHam);

    const currentObject = currentIsObject ? currentValue : {};
    const resultValue = clone(currentObject);

    let currentChanged = false;
    let deferUntilState: number | undefined = undefined;

    for (const [key, incomingSubHam] of entries(incomingHam[1])) {
      const incomingSubValue = (incomingValue as any)[key];

      const currentSubHam = replace ? EMPTY_HAM_STATE : resultHam[1][key];
      const currentSubValue = replace ? undefined : currentObject[key];

      // console.log(incomingSubHam);
      // console.log(incomingSubValue);
      // console.log(currentSubHam);
      // console.log(currentSubValue);

      const subMerge = merge(
        machineState,
        incomingSubHam,
        incomingSubValue,
        currentSubHam,
        currentSubValue
      );

      // console.log(subMerge.resultHam);
      // console.log(subMerge.resultValue);

      if (subMerge.resultHam !== EMPTY_HAM_STATE) {
        resultHam[1][key] = subMerge.resultHam;
      }

      if (subMerge.resultValue === undefined) {
        if (key in resultValue) {
          delete resultValue[key];
        }
      } else {
        resultValue[key] = subMerge.resultValue;
      }

      currentChanged = currentChanged || subMerge.currentChanged;
      if (subMerge.deferUntilState != null) {
        deferUntilState = Math.min(
          deferUntilState || Infinity,
          subMerge.deferUntilState
        );
      }
    }

    return deferUntilState == null
      ? { resultHam, resultValue, currentChanged }
      : { resultHam, resultValue, currentChanged, deferUntilState };
  }

  if (currentState < incomingState) {
    // incoming value is newer
    return {
      resultHam: incomingHam,
      resultValue: incomingValue,
      currentChanged: true,
    };
  }

  // currentState === incomingState
  if (incomingValue === currentValue) {
    // equal
    return {
      resultHam: currentHam,
      resultValue: currentValue,
      currentChanged: false,
    };
  }

  // finally just JSON compare and select the winner
  // prefer objects over primitive, otherwise compare JSON lexed value
  const currIsObj = isObject(currentValue);
  const incIsObj = isObject(incomingValue);

  return (currIsObj && !incIsObj) ||
    (!currIsObj &&
      !incIsObj &&
      (JSON.stringify(incomingValue) || '') <
        (JSON.stringify(currentValue) || ''))
    ? {
        resultHam: currentHam,
        resultValue: currentValue,
        currentChanged: false,
      }
    : {
        resultHam: incomingHam,
        resultValue: incomingValue,
        currentChanged: true,
      };
}
