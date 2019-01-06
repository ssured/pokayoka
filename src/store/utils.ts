import {
  types as t,
  getRoot,
  Instance,
  getIdentifier,
  isStateTreeNode,
  addDisposer,
  IStateTreeNode,
} from 'mobx-state-tree';
import { observable, runInAction } from 'mobx';
import SubscribableEvent from 'subscribableevent';

// internal event to register the union(Instance, referenceTo(Instance)) type of field
export type ReferenceObjectEvent = { snapshot: any };
export const referenceObjectEvent = new SubscribableEvent<
  (event: ReferenceObjectEvent) => void
>();

export const referenceHandler = {
  get(
    identifier: string, // | number,
    parent: Instance<any> | null
  ): Instance<any> | null {
    return (
      parent &&
      (getRoot(parent) as any).findOrFetch &&
      (getRoot(parent) as any).findOrFetch(identifier)
    );
  },
  set(
    value: any
    // parent: IAnyStateTreeNode | null
  ): string {
    if (isStateTreeNode(value)) {
      return getIdentifier(value)!;
    }
    const snapshot = value as any;
    referenceObjectEvent.fire({ snapshot });
    return snapshot._id;
  },
} as any;

// consider implementing https://developers.google.com/web/updates/2015/08/using-requestidlecallback?hl=en
export const intentionalSideEffect = (
  self: IStateTreeNode,
  fn: (...args: any[]) => any
) => {
  const timeout = setTimeout(() => runInAction(fn), 1);
  if (isStateTreeNode(self)) {
    addDisposer(self, () => clearInterval(timeout));
  }
};
