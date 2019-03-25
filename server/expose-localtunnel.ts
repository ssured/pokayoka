import localtunnel, { Tunnel } from 'localtunnel';
import { Express } from 'express';
import pify from 'pify';
import console = require('console');

let tunnel: Tunnel;

export function addTunnel(app: Express, port: number) {
  app.get('/tunnel', async (req, res) => {
    try {
      if (!tunnel) {
        tunnel = await pify(localtunnel)(port);
        console.log('Created tunnel: ', tunnel.url);
        //   tunnel!.on('request', (info) => console.log('tunnel', info))
        process.on('SIGINT', () => {
          tunnel.close();
          console.log('Closed tunnel');
        });
      }
      res.redirect(tunnel.url!);
    } catch (e) {
      res.json({ ok: 'false', error: e });
    }
  });
}
