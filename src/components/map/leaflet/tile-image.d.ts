import React from 'react';

declare const TileImage: React.FunctionComponent<{
  url: null | string | Promise<string>;
  width: number;
  height: number;
  availableZoomLevels?: number[];
  urlForXYZ?: (x: number, y: number, z: number) => string | null;
}>;

export default TileImage;
