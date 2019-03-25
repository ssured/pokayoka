declare module 'localtunnel' {
  export type Tunnel = {
    url: string | undefined;
    on:
      | ((event: 'request', callback: (info: any) => void) => void)
      | ((event: 'error', callback: (error: any) => void) => void)
      | ((event: 'close', callback: () => void) => void);
    close: () => void;
  };

  export default function localtunnel(
    port: number,
    options: {
      subdomain?: string;
      local_host?: string;
    },
    callback: (err: any, tunnel: Tunnel) => void
  ): Tunnel;
}
