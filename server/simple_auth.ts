import express from 'express';
import nano from 'nano';

const encodeUser = (user: string) => `org.couchdb.user:${user.toLowerCase()}`;
const decodeUser = (key: string) => key.replace(/^org\.couchdb.user:/, '');

const _users = nano({
  url: 'http://admin:admin@localhost:5984',
}).use('_users');

export const authRouter = express.Router();

authRouter.put('/create', async (req, res) => {
  try {
    const { username, password, ...profile } = req.body;

    try {
      await _users.get(encodeUser(username));
      res.status(409);
      res.json({ ok: false, reason: 'username already taken' });
      return;
    } catch (e) {
      if (e.status !== 404) {
        throw e;
      }
    }

    const doc = {
      _id: encodeUser(username),
      name: username,
      password,
      profile,
    };
    const result = await _users.insert(doc);
    res.json({
      ...doc,
      _rev: result.rev,
    });
  } catch (e) {
    res.status(500);
    res.json({ ok: false, reason: 'unknown' });
  }
});
