import debug from 'debug';
import base, { filename } from 'paths.macro';

import { serverManifest, clientManifest } from './shared';
import { ServerApi } from './server';
import MRPC from 'muxrpc';

const log = debug(`${base}${filename}`);

const clientImplementation = {};

export type ClientApi = typeof clientImplementation;

export const muxClient = () => {
  const result = MRPC(serverManifest, clientManifest)(clientImplementation);
  return result as typeof result & ServerApi;
};
