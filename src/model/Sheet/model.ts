import * as t from 'io-ts';
import {
  Serialized,
  tMany,
  Model,
  AsyncPropertiesOf,
  WrapAsync,
  MapOf,
} from '../base';
import { computed } from 'mobx';
import { SPOShape } from '../../../utils/spo';
import { Tile, AsyncTile } from './tile';

export const Sheet = t.intersection(
  [
    t.type({
      name: t.string,
      width: t.number,
      height: t.number,
      images: t.record(t.string, Tile),
      $thumb: t.string,
    }),
    t.partial({
      /**
       * CDN hash of source file
       */
      $source: t.string,
    }),
  ],
  'sheet'
);
export type Sheet = t.TypeOf<typeof Sheet>;
type SerializedSheet = Serialized<Sheet>;
const SerializedSheet: t.Type<SerializedSheet> = t.intersection([
  t.type({
    ...Sheet.types[0].props,
    images: tMany,
  }),
  t.partial({
    ...Sheet.types[1].props,
  }),
]);

export class SheetModel extends Model<Sheet>
  implements AsyncPropertiesOf<Sheet> {
  @computed
  get name() {
    return this.serialized.name;
  }
  @computed
  get width() {
    return this.serialized.width;
  }
  @computed
  get height() {
    return this.serialized.height;
  }
  @computed
  get $thumb() {
    return this.serialized.$thumb;
  }
  @computed
  get images() {
    return MapOf(AsyncTile, this.serialized.images);
  }
}

export function AsyncSheet(obj: SPOShape) {
  return new WrapAsync(obj, SerializedSheet, SheetModel);
}
