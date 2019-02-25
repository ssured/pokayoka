declare module 'pull-level' {
  import { AbstractIteratorOptions } from 'abstract-leveldown';
  import { LevelUp } from 'levelup';
  import { Source, Sink } from 'pull-stream';
  import Charwise, { CharwiseKey } from 'charwise';

  export type PullLevelReadOptions = AbstractIteratorOptions<CharwiseKey> & {
    keyEncoding?: typeof Charwise;
    onAbort?: (err: Error) => void;
    live?: boolean;
    sync?: boolean;
  };

  const pl: {
    read: <T = any>(db: LevelUp<any>, opts?: PullLevelReadOptions) => Source<T>;
    write: <T = any>(
      db: LevelUp<any>,
      opts?: AbstractIteratorOptions
    ) => Sink<T>;
  };

  export default pl;
}
