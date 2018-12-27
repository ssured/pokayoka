---
to: src/models/<%= Name %>.ts
unless_exists: true
---
import {
  types as t,
  Instance,
  SnapshotIn,
  SnapshotOut,
  IStateTreeNode,
  isStateTreeNode,
} from 'mobx-state-tree';
import { base, referenceHandler } from './base';

export const <%= name %>Type = '<%= name %>';
export const <%= Name %> = base(<%= name %>Type)
  .props({
  })
  // .preProcessSnapshot(snapshot => ({...snapshot}))
  .views(self => {
    return {  };
  });
  
// --- hygen generated code

export const <%= Name %>Ref = t.reference(<%= Name %>, referenceHandler);
export const is<%= Name %> = (obj: IStateTreeNode): obj is T<%= Name %>Instance =>
  isStateTreeNode(obj) && (obj as any).type === <%= name %>Type;
  
export type T<%= Name %>Instance = Instance<typeof <%= Name %>>;
export type T<%= Name %>SnapshotIn = SnapshotIn<typeof <%= Name %>>;
export type T<%= Name %>SnapshotOut = SnapshotOut<typeof <%= Name %>>;
export type T<%= Name %> = T<%= Name %>Instance | T<%= Name %>SnapshotIn;

export interface I<%= Name %> extends T<%= Name %>Instance {}
export interface I<%= Name %>SnapshotIn extends T<%= Name %>SnapshotIn {}
export interface I<%= Name %>SnapshotOut extends T<%= Name %>SnapshotOut {}
