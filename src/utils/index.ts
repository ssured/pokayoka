import { applyOperation } from 'fast-json-patch';

import isEqualWith from 'lodash.isequalwith';
export const isEqual = isEqualWith;

export const objectFromPatchStream = (): {
  object: () => any;
  updateObject: (msg: any) => void;
} => {
  let object: any = null;
  return {
    object: () => object,
    updateObject: (message: any) => {
      if (message.snapshot) {
        object = message.snapshot;
      } else if (message.patch) {
        applyOperation(object, message.patch, false, true);
      }
    },
  };
};

export const ensureNever = <T = any>(arg: never, shouldThrow = true): T => {
  if (shouldThrow) {
    throw new Error('Typescript never error, should never be reached');
  }
  return (undefined as unknown) as T;
};
