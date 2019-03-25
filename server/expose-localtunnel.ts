import localtunnel, { Tunnel } from 'localtunnel';
import { Express } from 'express';
import pify from 'pify';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const SUBDOMAIN_FILE = 'localtunnel-name.txt';

const subdomainFile = path.join(__dirname, SUBDOMAIN_FILE);
const subdomain: string | undefined = (() => {
  try {
    return readFileSync(subdomainFile, 'utf-8');
  } catch (e) {
    return undefined;
  }
})();

let tunnel: Tunnel;

function writeSubdomainFromUrl(url: string) {
  const matches = url.match(/^https?:\/\/(.*)\.localtunnel\.me$/);
  if (matches) {
    writeFileSync(subdomainFile, matches[1], 'utf-8');
  }
}

export function addTunnel(app: Express, port: number) {
  app.get('/tunnel', async (req, res) => {
    try {
      if (!tunnel) {
        tunnel = await pify(localtunnel)(port, { subdomain });
        console.log('Created tunnel: ', tunnel.url);
        writeSubdomainFromUrl(tunnel.url!);
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
