import debug from 'debug';

import { ServerScope } from 'nano';
import MRPC from 'muxrpc';

import { dbChangesSinceLive, DbChangesSinceLiveOptions } from '../utils/pull';
import { serverManifest, clientManifest } from './shared';
import { ClientApi } from './client';

const log = debug(__filename.replace(__dirname, '~'));

export type UserProfile = { name: string; roles: string[] };

const serverImplementation = (nano: ServerScope, profile: UserProfile) => ({
  changesSince(name: string, options: DbChangesSinceLiveOptions = {}) {
    log.extend('changesSince')('%s %o %s', name, options, profile.name);
    return dbChangesSinceLive(nano, name, options);
  },
});

export type ServerApi = ReturnType<typeof serverImplementation>;

export const muxServer = (nano: ServerScope, profile: UserProfile) => {
  const result = MRPC(clientManifest, serverManifest)(
    serverImplementation(nano, profile)
  );
  return result as typeof result & ClientApi;
};
