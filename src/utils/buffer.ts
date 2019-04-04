// https://stackoverflow.com/a/53307879
export function toHex(buffer: ArrayBuffer) {
  let s = '';
  const h = '0123456789abcdef';
  new Uint8Array(buffer).forEach(v => {
    s += h[v >> 4] + h[v & 15];
  });
  return s;
}
