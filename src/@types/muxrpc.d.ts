declare module 'muxrpc' {
  import { Through } from 'pull-stream';

  type MuxType = 'sink' | 'source' | 'async' | 'through';
  type MuxManifest = { [key: string]: MuxType };

  export default function MRPC(
    remote: MuxManifest | null,
    local: MuxManifest | null
  ): (implementation: {
    [key: string]: (...args: any[]) => any;
  }) => { createStream: () => Through<any, any> };
}
