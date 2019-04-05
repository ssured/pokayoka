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
import { SPOShape } from '../../utils/spo';
import { Tile, AsyncTile } from './tile';
import { TRANSPARENT_PIXEL } from '../../constants';

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

  urlForXYZ(x: number, y: number, z: number) {
    const key = [z, y, x].join('/');
    const image = this.images && this.images.get(key);
    console.log(
      'urlForXYZ',
      z,
      y,
      z,
      image && image.value && image.value.$hash
    );
    return image && image.value
      ? `/cdn/${image.value.$hash}`
      : TRANSPARENT_PIXEL;
  }

  @computed
  get availableZoomLevels() {
    const levels = new Set<number>();
    for (const key of this.images.keys()) {
      const [z] = key.split('/');
      levels.add(parseInt(z, 10));
    }
    return [...levels].sort();
  }
}

export function AsyncSheet(obj: SPOShape) {
  return new WrapAsync(obj, SerializedSheet, SheetModel);
}
