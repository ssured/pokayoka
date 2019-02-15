import { CharwiseKey } from 'charwise';

export class Partition {
  public static root() {
    return new Partition();
  }

  private constructor(private parent: CharwiseKey[] = []) {}

  public encode(key: CharwiseKey): CharwiseKey {
    return this.parent.reduceRight((encoded, key) => [key, encoded], key);
  }

  public decode(nested: CharwiseKey): CharwiseKey {
    return this.parent.reduceRight(
      nested => (nested as CharwiseKey[])[1],
      nested
    );
  }

  public partition(key: CharwiseKey): Partition {
    return new Partition([...this.parent, key]);
  }
}
