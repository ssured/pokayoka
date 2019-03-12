declare module 'charwise' {
  export type CharwiseKey =
    | null
    | false
    | true
    | number
    | string
    | undefined
    | CharwiseArray;
  interface CharwiseArray extends Array<CharwiseKey> {}

  const charwise: {
    type: 'charwise';
    encode: (obj: CharwiseKey) => string;
    decode: (str: string) => CharwiseKey;
    buffer: false;
  };

  export default charwise;
}
