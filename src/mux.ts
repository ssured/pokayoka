import debug from 'debug';
import base, { filename } from 'paths.macro';
const log = debug(`${base}${filename}`);

export function startMux() {
  {
    const { host, protocol } = window.location;
    const wsUrl = `ws${protocol.indexOf('https') > -1 ? 's' : ''}://${host}/`;
    const ws = new WebSocket(wsUrl);
    ws.addEventListener('message', ({ data }) => {
      log('message', data);
    });
  }
  log('mux started');
}
