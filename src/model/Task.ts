import { UndefinedOrPartialSPO } from '../utils/spo-observable';

declare global {
  type Task = Partial<{
    '@type': 'Task';
    identifier: string;
    name: string;
    deliverable: string;
  }>;
}

export type PartialTask = UndefinedOrPartialSPO<Task>;
