import * as t from 'io-ts';
import { Serialized, Model, AsyncPropertiesOf, WrapAsync } from '../base';
import { computed } from 'mobx';
import { SPOShape } from '../../utils/spo';

export const Tile = t.type(
  {
    x: t.number,
    y: t.number,
    z: t.number,
    $hash: t.string,
  },
  'tile'
);
export type Tile = t.TypeOf<typeof Tile>;
type SerializedTile = Serialized<Tile>;
const SerializedTile: t.Type<SerializedTile> = t.type({
  ...Tile.props,
});

export class TileModel extends Model<Tile> implements AsyncPropertiesOf<Tile> {
  @computed
  get x() {
    return this.serialized.x;
  }
  @computed
  get y() {
    return this.serialized.y;
  }
  @computed
  get z() {
    return this.serialized.z;
  }
  @computed
  get $hash() {
    return this.serialized.$hash;
  }
}

export function AsyncTile(obj: SPOShape) {
  return new WrapAsync(obj, SerializedTile, TileModel);
}
