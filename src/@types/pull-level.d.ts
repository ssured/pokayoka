declare module 'pull-level' {
  import { AbstractIteratorOptions } from 'abstract-leveldown';
  import { LevelUp } from 'levelup';
  import { Source, Sink } from 'pull-stream';

  const pl: {
    read: <T = any>(
      db: LevelUp<any>,
      opts?: AbstractIteratorOptions
    ) => Source<T>;
    write: <T = any>(
      db: LevelUp<any>,
      opts?: AbstractIteratorOptions
    ) => Sink<T>;
  };

  export = pl;
}
