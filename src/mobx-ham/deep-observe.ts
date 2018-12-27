// source https://github.com/mobxjs/mobx-utils/blob/f278baeec389fa05047e388f6b3892b521eaca84/src/deepObserve.ts

// This is a copy of the version of deepObserve from mobx-utils with the following differences
// - does not track changes to arrays
// - returns paths as an array instead of a string

import {
  observe,
  isObservableMap,
  isObservableObject,
  //   isObservableArray,
  IObjectDidChange,
  //   IArrayChange,
  //   IArraySplice,
  IMapDidChange,
  values,
  entries,
} from 'mobx';
import { IDisposer } from 'mobx-utils';

type IChange = IObjectDidChange | IMapDidChange;

type Entry = {
  dispose: IDisposer;
  path: string;
  parent?: Entry;
};

function buildPath(entry: Entry): string[] {
  const res: string[] = [];
  while (entry.parent) {
    res.push(entry.path);
    entry = entry.parent; // tslint:disable-line
  }
  return res.reverse();
}

/**
 * Given an object, deeply observes the given object.
 * It is like `observe` from mobx, but applied recursively, including all future children
 *
 * Note that the given object cannot ever contain cycles and should be a tree.
 *
 * As benefit: path and root will be provided in the callback, so the signature of the listener is
 * (change, path, root) => void
 *
 * The returned disposer can be invoked to clean up the listner
 *
 * @example
 * const disposer = deepObserve(target, (change, path) => {
 *    console.dir(change)
 * })
 */
export function deepObserve<T extends object>(
  target: T,
  listener: (change: IChange, path: string[], root: T) => void
): IDisposer {
  const entrySet = new WeakMap<any, Entry>();

  function genericListener(change: IChange) {
    const entry = entrySet.get(change.object)!;
    processChange(change, entry);
    listener(change, buildPath(entry), target);
  }

  function processChange(change: IChange, parent: Entry) {
    switch (change.type) {
      // Object changes
      case 'add': // also for map
        observeRecursively(change.newValue, parent, change.name);
        break;
      case 'update': // also for  map
        unobserveRecursively(change.oldValue);
        observeRecursively(
          change.newValue,
          parent,
          (change as any).name || String((change as any).index)
        );
        break;
      case 'remove': // object
      case 'delete': // map
        unobserveRecursively(change.oldValue);
        break;
    }
  }

  function observeRecursively(
    thing: any,
    parent: undefined | Entry,
    path: string
  ) {
    if (
      isObservableObject(thing) ||
      //   isObservableArray(thing) ||
      isObservableMap(thing)
    ) {
      if (entrySet.has(thing)) {
        const entry = entrySet.get(thing)!;
        if (entry.parent !== parent || entry.path !== path) {
          // MWE: this constraint is artificial, and this tool could be made to work with cycles,
          // but it increases administration complexity, has tricky edge cases and the meaning of 'path'
          // would become less clear. So doesn't seem to be needed for now
          throw new Error(
            `The same observable object cannot appear twice in the same tree, trying to assign it to '${buildPath(
              parent!
            )}/${path}', but it already exists at '${buildPath(
              entry.parent!
            )}/${entry.path}'`
          );
        }
      } else {
        const entry = {
          parent,
          path,
          dispose: observe(thing, genericListener),
        };
        entrySet.set(thing, entry);
        entries(thing).forEach(([key, value]) =>
          observeRecursively(value, entry, key)
        );
      }
    }
  }

  function unobserveRecursively(thing: any) {
    const entry = entrySet.get(thing);
    if (!entry) return;
    entrySet.delete(thing);
    entry.dispose();
    values(thing).forEach(unobserveRecursively);
  }

  observeRecursively(target, undefined, '');

  return () => {
    unobserveRecursively(target);
  };
}
