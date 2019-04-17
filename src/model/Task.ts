import { UndefinedOrPartialSPO } from '../utils/spo-observable';

declare global {
  type Task = {
    '@type': 'Task';
    identifier: string;
    name: string;
    deliverable?: string;
  };
}

export type PartialTask = UndefinedOrPartialSPO<Task>;
