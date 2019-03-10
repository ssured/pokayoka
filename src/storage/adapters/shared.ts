import { LevelUp } from 'levelup';
import { CharwiseKey } from 'charwise';
import { JsonEntry } from '../../utils/json';
import {
  AbstractBatch,
  AbstractIteratorOptions,
  AbstractLevelDOWN,
} from 'abstract-leveldown';

export type KeyType = CharwiseKey;
export type ValueType = JsonEntry;
export type BatchOperation = AbstractBatch<KeyType, ValueType>;
export type BatchOperations = BatchOperation[];
export type ReadOptions<K = KeyType> = AbstractIteratorOptions<K>;
export type KeyValue<K = KeyType, V = ValueType> = { key: K; value: V };

export class SharedAdapter {
  // @ts-ignore strictPropertyInitialization
  level: LevelUp<AbstractLevelDOWN<KeyType, ValueType>>;

  batch(operations: BatchOperations) {
    return this.level.batch(operations);
  }

  get<T = ValueType>(key: KeyType) {
    return (this.level.get(key) as unknown) as T;
  }

  query<K = KeyType, V = ValueType>(options: ReadOptions) {
    return (this.level.createReadStream(
      options
    ) as unknown) as AsyncIterableIterator<KeyValue<K, V>>;
  }

  async queryList<K = KeyType, V = ValueType>(options: ReadOptions) {
    const result: KeyValue<K, V>[] = [];
    for await (const data of this.query<K, V>(options)) {
      result.push(data);
    }
    return result;
  }
}

type SharedAdapterType = InstanceType<typeof SharedAdapter>;

export interface StorageAdapter extends SharedAdapterType {}
