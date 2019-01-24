declare module 'charwise' {
  interface Json {
    [x: string]: string | number | boolean | Date | Json | JsonArray;
  }

  interface JsonArray
    extends Array<string | number | boolean | Date | Json | JsonArray> {}

  type jsonSerializable = string | number | boolean | Date | Json | JsonArray;

  const charwise: {
    type: 'charwise';
    encode: (obj: jsonSerializable) => string;
    decode: (str: string) => jsonSerializable;
    buffer: false;
  };

  export = charwise;
}
