import charwise, { CharwiseKey } from 'charwise';
import { LevelUp } from 'levelup';
import pull, { filter, map, Source, Sink } from 'pull-stream';
import { AbstractIteratorOptions } from 'abstract-leveldown';
import pl, { PullLevelReadOptions } from 'pull-level';

export class Partition {
  public static root(db: LevelUp) {
    return new Partition(db);
  }

  private constructor(public db: LevelUp, private parent: CharwiseKey[] = []) {}

  public encode(key: CharwiseKey): CharwiseKey {
    return this.parent.reduceRight((encoded, key) => [key, encoded], key);
  }

  public decode(nested: CharwiseKey): CharwiseKey {
    return this.parent.reduceRight(
      nested => (nested as CharwiseKey[])[1],
      nested
    );
  }

  public isRoot(): boolean {
    return this.parent.length === 0;
  }

  public partition(key: CharwiseKey): Partition {
    return new Partition(this.db, [...this.parent, key]);
  }

  public source<T = any>(
    options: PullLevelReadOptions = { keyEncoding: charwise }
  ) {
    const query: PullLevelReadOptions = {
      keyEncoding: charwise,
      live: true,
      // sync: false,
      ...options,
      ...('gte' in options ? { gte: this.encode(options.gte) } : {}),
      ...('gt' in options ? { gt: this.encode(options.gt) } : {}),
      ...('lte' in options ? { lte: this.encode(options.lte) } : {}),
      ...('lt' in options ? { lt: this.encode(options.lt) } : {}),
    };

    return pull(
      pl.read<{ key: CharwiseKey; value: T; type?: 'put' | 'del' }>(
        this.db,
        query
      ),
      filter(({ type }) => type !== 'del'), // filter delete tasks made by createSink
      map(item => ({ key: this.decode(item.key), value: item.value }))
    );
  }

  public sink<T = any>(options: AbstractIteratorOptions = {}) {
    return pull(
      map<
        { key: CharwiseKey; value: T; type?: 'put' | 'del' },
        { key: CharwiseKey; value: T; type?: 'put' | 'del' }
      >(item => ({
        ...item,
        key: this.encode(item.key),
      })),
      pl.write(this.db, options)
    );
  }
}
