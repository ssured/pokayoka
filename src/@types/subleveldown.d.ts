// Type definitions for level
// Project: https://github.com/Level/subleveldown
declare module 'subleveldown' {
  import { LevelUp } from 'levelup';

  interface Encoding<T = any, U = any> {
    type: string;
    encode: (obj: T) => U;
    decode: (encoded: U) => T;
    buffer: boolean;
  }

  interface SubLevelDownOptions {
    separator?: string;
    keyEncoding?: Encoding | string;
    valueEncoding?: Encoding | string;
  }

  function subleveldown<T extends LevelUp<any>>(
    level: T,
    prefix: string,
    options?: SubLevelDownOptions
  ): T;

  export = subleveldown;
}
