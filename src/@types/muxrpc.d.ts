declare module 'muxrpc' {
  import { Through } from 'pull-stream';

  type MuxType = 'sink' | 'source' | 'async' | 'duplex';
  type MuxManifest = { [key: string]: MuxType };

  export default function MRPC(
    remote: MuxManifest | null,
    local: MuxManifest | null
  ): (implementation: {
    [key: string]: (...args: any[]) => any;
  }) => {
    createStream(
      cb?: (err: Error | null | undefined) => void
    ): Through<any, any>;
  };
}
