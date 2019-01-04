import { isObservable, entries as mobxEntries } from 'mobx';

export const safeEntries = <T extends object>(obj: T) =>
  isObservable(obj) ? mobxEntries(obj) : Object.entries(obj);
