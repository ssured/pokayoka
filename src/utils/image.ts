import loadImage, { loadImageOptions } from 'blueimp-load-image/js/load-image';
import 'blueimp-load-image/js/load-image-exif';
import 'blueimp-load-image/js/load-image-orientation';

export const HTMLImage = Image;

export const imageSizeFromDataURL = (dataURL: string) => {
  const image = new Image();
  const loadedImagePromise = new Promise<{ width: number; height: number }>(
    resolve =>
      (image.onload = () =>
        resolve({ width: image.width, height: image.height }))
  );
  image.src = dataURL;
  return loadedImagePromise;
};

export const loadAsCanvas = (file: File | Blob, options: loadImageOptions) => {
  return new Promise<HTMLCanvasElement>((res, rej) => {
    loadImage.parseMetaData(
      file,
      data => {
        if (data.exif) {
          options.orientation = data.exif.get('Orientation');
        }
        loadImage(
          file,
          canvas => {
            if (!canvas || (canvas as any).type === 'error') {
              return rej(canvas);
            }
            res(canvas as any);
          },
          {
            canvas: true,
            downsamplingRatio: 0.5,
            disableExifThumbnail: true,
            disableImageHead: true,
            disableExifSub: true,
            disableExifGps: true,
            ...options,
          }
        );
      },
      {
        disableExifThumbnail: true,
        disableImageHead: true,
        disableExifSub: true,
        disableExifGps: true,
      }
    );
  });
};
