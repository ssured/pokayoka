/**
 * AUTHENTICATION ENDPOINT
 */

const express = require('express');
const { Bearer, Basic } = require('permit');
const pwd = require('pwd');
pwd.iterations(20000);
const dlv = require('dlv');
const addHours = require('date-fns/add_hours');

const { generateId } = require('../src/utils/id');

const api = ((dbUrl, userDbName) => {
  const nano = require('nano')(dbUrl);
  // the database where we keep the accounts
  const accountsDb = nano.use(userDbName);
  // the database which couchdb uses for user administration
  const _usersDb = nano.use('_users');

  const keyFromToken = token => `org.couchdb.user:${token}`;
  const tokenFromKey = key => key.replace(/^org\.couchdb.user:/, '');

  const api = {
    db: {
      getTokens: async db => {
        const security = await nano.request({
          db,
          path: '_security',
        });

        return security;
      },
      addToken: async (db, token) => {},
    },
    user: {
      create: async (username, password, { _id, ...profile }) => {
        const doc = {
          _id: _id || uuidv4(),

          auth: { username, ...(await pwd.hash(password)) },
          tokens: { ...(await createToken()) },

          profile,
          databases: [],
        };
        const { rev } = await accountsDb.insert(doc);
        doc._rev = rev;
        return doc;
      },
      // read: get,
      update: async doc => {
        const { rev } = await accountsDb.insert(doc);
        doc._rev = rev;
        return doc;
      },
      delete: async ({ _id, _rev }) =>
        accountsDb.insert({ _id, _rev, _deleted: true }),
      getByToken: async token => {
        const { rows } = await accountsDb.view('users', 'byToken', {
          keys: [token],
        });
        return rows.length === 0 ? null : accountsDb.get(rows[0].id);
      },
    },
    project: {
      create: async name => {
        const projectId = generateId();
        await nano.db.create(projectId);
        const db = nano.use(projectId);
        await db.insert({ _id: projectId, title: name });

        const security = await nano.request({
          db: projectId,
          path: '_security',
        });

        security.members = security.members || {};
        security.members.roles = security.members.roles || [];
        security.members.roles.push(`member-${projectId}`);

        security.admins = security.admins || {};
        security.admins.roles = security.admins.roles || [];
        security.admins.roles.push(`admin-${projectId}`);

        return (
          !!(await nano.request({
            method: 'put',
            db: projectId,
            path: '_security',
            body: security,
          })).ok && projectId
        );
      },
    },
    users: {
      getByUsername: async username => {
        const { rows } = await accountsDb.view('users', 'byUsername', {
          keys: [username],
        });
        return Promise.all(rows.map(({ id }) => accountsDb.get(id)));
      },
      getByTokens: async tokens => {
        const { rows } = await accountsDb.view('users', 'byToken', {
          keys: tokens,
        });
        return Promise.all(
          rows
            .map(({ id }) => id)
            .filter((id, i, a) => a.indexOf(id) === i) // filter unique
            .map(id => accountsDb.get(id))
        );
      },
    },
  };

  new Promise(res => setTimeout(res, 100))
    .then(() => _usersDb.list())
    .then(async ({ rows }) => {
      try {
        const knownTokenIds = rows
          .filter(row => row.id[0] !== '_')
          .filter(row => row.value.deleted !== true)
          .map(row => tokenFromKey(row.id));

        const dateJSONString = JSON.stringify(new Date().toISOString());
        const [validTokenIds, invalidTokenIds] = await Promise.all([
          (await accountsDb.view('tokens', 'byExpiration', {
            start_key: dateJSONString,
          })).rows.map(
            ({
              // id: userId,
              // key: expiry,
              value: tokenId,
            }) => tokenId
          ),
          (await accountsDb.view('tokens', 'byExpiration', {
            end_key: dateJSONString,
          })).rows.map(
            ({
              // id: userId,
              // key: expiry,
              value: tokenId,
            }) => tokenId
          ),
        ]);

        // validTokenIds.sort();
        // invalidTokenIds.sort();
        // knownTokenIds.sort();
        // console.log({ validTokenIds, invalidTokenIds, knownTokenIds });

        // remove tokens from users which are not valid anymore
        const invalidUsers = await api.users.getByTokens(invalidTokenIds);
        await Promise.all(
          invalidUsers.map(user => {
            user.tokens = Object.keys(user.tokens).reduce((tokens, token) => {
              if (validTokenIds.indexOf(token) > -1) {
                tokens[token] = user.tokens[token];
              }
              return tokens;
            }, {});
            return api.user.update(user);
          })
        );

        // remove tokens from users db which are not valid anymore
        knownTokenIds
          .filter(token => validTokenIds.indexOf(token) === -1)
          .forEach(async token => {
            try {
              const { _id, _rev } = await users.db.get(keyFromToken(token));
              const result = await _usersDb.insert({
                _id,
                _rev,
                _deleted: true,
              });
              console.log('deleted user', _id, result);
            } catch (e) {
              console.error('failed to delete user', e);
            }
          });

        // TODO replace this with nano changes feed, pouchdb sometimes seems to lose connectien
        const feed = accountsDb.follow({ since: 'now', include_docs: true });
        console.log('START LISTENING FOR USERS CHANGE');

        feed.on('change', async change => {
          const {
            deleted,
            doc: { tokens, databases },
          } = change;
          if (deleted || tokens == null) return;

          console.log('GOT CHANGE', change);

          try {
            const roles = databases.map(name => `member-${name}`).sort();
            const rolesJSON = JSON.stringify(roles);

            const rolesMatch = userRoles =>
              JSON.stringify(userRoles.sort()) === rolesJSON;

            const users = (await _usersDb.list({
              keys: Object.keys(tokens).map(keyFromToken),
              include_docs: true,
            })).rows;

            users
              .filter(user => dlv(user, 'value.deleted') !== true)
              .forEach(async user => {
                const { key, /*value,*/ error, doc } = user;
                if (error != null) {
                  if (error === 'not_found') {
                    // create the user
                    await _usersDb.insert({
                      _id: key,
                      name: tokenFromKey(key),
                      password: tokenFromKey(key),
                      type: 'user',
                      roles,
                    });
                    console.log('inserted', key, roles);
                  } else {
                    console.log('users follow user detail error', error, user);
                  }
                } else if (!rolesMatch(doc.roles || [])) {
                  doc.roles = roles;
                  await _usersDb.insert(doc);
                  console.log('updated', key, roles);
                  // update the user roles to fit the databases list
                }
              });
          } catch (e) {
            console.error('users follow error', e);
          }
        });
        feed.follow();
      } catch (e) {
        console.error('usersList general error', e);
      }
    })
    .catch(err => console.error('USER MGT ERROR', err));

  return api;
})('http://admin:admin@localhost:5984', 'users');

// https://github.com/ianstormtaylor/permit/blob/master/examples/express.js

// A permit that checks for HTTP Bearer Auth, falling back to a query string.
const bearer = new Bearer({
  // basic: 'username',
  // query: 'access_token',
});
const basic = new Basic({
  // query: ['username', 'password'],
});

// guard which uses token to authenticate
async function permitBearer(req, res, next) {
  try {
    const token = bearer.check(req);

    if (!token) {
      bearer.fail(res);
      return next(new Error(`Authentication required!`));
    }

    const user = await api.user.getByToken(token);

    const expiry = new Date(user.tokens[token].expires);
    if (expiry < new Date()) {
      bearer.fail(res);
      return next(new Error(`Authentication expired!`));
    }

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    bearer.fail(res);
    return next(new Error(`Authentication invalid!`));
  }
}

// guard which checks using HTTP Basic auth
async function permitBasic(req, res, next) {
  try {
    const credentials = basic.check(req);

    if (!credentials) {
      basic.fail(res);
      return next(new Error(`Authentication required!`));
    }

    const [username, password] = credentials;

    const users = await api.users.getByUsername(username);

    const usersWithSamePassword = users.filter(user =>
      verifyPassword(user, password)
    );

    if (usersWithSamePassword.length > 1) {
      basic.fail(res);
      return next(new Error(`Authentication you have to reset your password`));
    }

    const user = usersWithSamePassword[0];

    if (!user) {
      basic.fail(res);
      return next(new Error(`Authentication invalid username / password!`));
    }

    req.user = user;
    next();
  } catch (e) {
    basic.fail(res);
    return next(new Error(`Authentication invalid!`));
  }
}

const authRouter = express.Router();

authRouter.put('/create', async (req, res) => {
  try {
    const { username, password, ...profile } = req.body;

    const users = await api.users.getByUsername(username);
    if (users.length > 0) {
      res.json({ ok: false, reason: 'username already taken' });
    }

    const user = await api.user.create(username, password, profile);
    res.json({
      _id: user._id,
      profile: user.profile,
      token: user.tokens,
    });
  } catch (e) {
    res.json({ ok: false });
  }
});

// request new token
authRouter.post('/token', permitBasic, async (req, res) => {
  try {
    const token = await createToken(req.user);
    await new Promise(res => setTimeout(res, 100)); // CouchDB needs some time to settle the new user
    // TODO just start polling CouchDB until the token is valid and then return the token
    res.json(token);
  } catch (e) {
    res.json({ ok: false });
  }
});

// refresh token
// authRouter.post('/refresh', permitBearer, async (req, res) => {
//   try {
//     const token = await createToken(req.user);
//     await deleteToken(req.user, req.token);
//     res.json(token);
//   } catch (e) {
//     res.json({ ok: false });
//   }
// });

authRouter.use('/logout', permitBearer, async (req, res) => {
  try {
    await deleteToken(req.user, req.token);
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false });
  }
});

authRouter.get('/account', permitBearer, (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.auth && req.user.auth.username,
    profile: req.user.profile,
    databases: req.user.databases,
  });
});

authRouter.put('/project', permitBearer, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.json({ ok: false, err: 'No name was given' });
    }
    const projectId = await api.project.create(name);
    const { user } = req;
    user.databases = user.databases || [];
    user.databases.push(projectId);
    await api.user.update(user);
    res.json({ ok: true, id: projectId });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

module.exports = authRouter;

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function verifyPassword({ auth: { salt, hash } }, password) {
  try {
    return hash === (await pwd.hash(password, salt)).hash;
  } catch (e) {
    return false;
  }
}

async function createToken(user = null) {
  const token = {
    [uuidv4()]: { expires: addHours(new Date(), 3 * 7 * 24).toISOString() },
  };

  if (user != null) {
    user.tokens = { ...user.tokens, ...token };
    await api.user.update(user);
  }

  return token;
}

async function deleteToken(user, token) {
  user.tokens[token].expires = new Date().toISOString();
  await api.user.update(user);
}
