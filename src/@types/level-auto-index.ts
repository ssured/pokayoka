// Type definitions for level
// Project: https://github.com/Level/subleveldown
declare module 'level-auto-index' {
  import { LevelUp } from 'levelup';

  interface AutoIndexOptions {
    multi?: boolean;
  }

  function createAutoIndex<T extends LevelUp<any>>(
    db: LevelUp<any>,
    idb: T,
    reduce: (doc: any) => any,
    options?: AutoIndexOptions
  ): T;

  export = createAutoIndex;
}
