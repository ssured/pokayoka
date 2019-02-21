import debug from 'debug';

import {
  dbChangesSinceLive,
  DbChangesSinceLiveOptions,
} from '../src/utils/pull';
import { ServerScope } from 'nano';

const log = debug(__filename.replace(__dirname, '~'));

export type UserProfile = { name: string; roles: string[] };

export const implementation = (profile: UserProfile) => ({
  changesSince(
    nano: ServerScope,
    name: string,
    options: DbChangesSinceLiveOptions = {}
  ) {
    log.extend('changesSince')('%s %o %s', name, options, profile.name);
    return dbChangesSinceLive(nano, name, options);
  },
});

export const api: { [key: string]: any } = {
  changesSince: 'source',
};
