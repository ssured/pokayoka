declare module 'blueimp-load-image/js/load-image' {
  // tslint:disable-next-line
  export interface loadImageOptions {
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
    orientation?: number | boolean;
    downsamplingRatio?: number;
    disableExifThumbnail?: boolean;
    disableImageHead?: boolean;
    disableExifSub?: boolean;
    disableExifGps?: boolean;
    meta?: boolean;
    canvas?: boolean;
  }

  type loadImage = (
    image: File | Blob,
    callback: (
      result: HTMLImageElement | HTMLCanvasElement | Error,
      metadata: any
    ) => void,
    options: loadImageOptions
  ) => any;

  type parseMetaData = (
    image: File | Blob,
    callback: (data: any) => void,
    options?: {
      maxMetaDataSize?: number;
      disableExifThumbnail?: boolean;
      disableImageHead?: boolean;
      disableExifSub?: boolean;
      disableExifGps?: boolean;
    }
  ) => void;

  const loadImage: loadImage & { parseMetaData: parseMetaData };

  export default loadImage;
}

declare module 'blueimp-load-image/js/load-image-exif';
declare module 'blueimp-load-image/js/load-image-orientation';
