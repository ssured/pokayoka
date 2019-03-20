declare module 'workbox-webpack-plugin' {
  export const InjectManifest: new (
    options: {
      swDest: string;
      swSrc: string;
      // importWorkboxFrom: 'local';
      // maximumFileSizeToCacheInBytes: number;
    }
  ) => any;
}
