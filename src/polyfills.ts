// https://github.com/mindfreakthemon-uawc/ua-web-challenge-x-semifinal/blob/db5fc63a353a8ba0830047d8bd2aa3586dbd5638/app/polyfills.ts

// TODO maybe something more efficient exists for Edge?
if (!HTMLCanvasElement.prototype.toBlob) {
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value(callback: BlobCallback, type?: string, quality?: any) {
      const [, encBinStr] = this.toDataURL(type, quality).split(',');

      const binStr = atob(encBinStr);
      const length = binStr.length;
      const array = new Uint8Array(length);

      for (let i = 0; i < length; i += 1) {
        array[i] = binStr.charCodeAt(i);
      }

      callback(new Blob([array], { type: type || 'image/png' }));
    },
  });
}
