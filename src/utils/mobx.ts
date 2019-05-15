import { isObservable, entries as mobxEntries, autorun } from 'mobx';

export const safeEntries = <T extends object>(obj: T) =>
  isObservable(obj) ? mobxEntries(obj) : Object.entries(obj);

export function live(fn: (done: () => void) => Promise<void>) {
  const done = autorun(() => {
    fn(() => setTimeout(() => done(), 0));
  });
  return done;
}
