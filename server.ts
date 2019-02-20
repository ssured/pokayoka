import debug from 'debug';

import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import { Cookie } from 'tough-cookie';
import proxy from 'express-http-proxy';
import WebSocket from 'ws';
import http from 'http';

import webpack from 'webpack';
import webpackConfig from './webpack.config';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import authRouter from './server/auth';
import got = require('got');

const log = debug(__filename.replace(__dirname, '~'));

const isDevelopment = true;
const app = express();
const server = http.createServer(app);

app.use(
  bodyParser.json({
    limit: '50mb',
  })
);
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
  })
);

app.use('/auth', authRouter);

const couchDbUrl = 'http://localhost:5984';
app.use('/db', proxy(couchDbUrl, {}));

const sessions = new WeakMap<
  http.IncomingMessage,
  { name: string; roles: string[] }
>();

const wss = new WebSocket.Server({
  server,
  verifyClient: async (info, cb) => {
    const ll = log.extend('verifyClient');

    const cookieHeader = info.req.headers.cookie;
    if (!cookieHeader) {
      ll('Failed to authorize ');
      return cb(false, 401, 'Not authorized');
    }

    const sessionCookie = Cookie.parse(cookieHeader);

    if (!sessionCookie) {
      ll('AuthSession not found in cookie %o', cookieHeader);
      return cb(false, 401, 'Not authorized');
    }

    try {
      // ll('cookie %o', sessionCookie.toString());
      const response = await got('_session', {
        baseUrl: couchDbUrl,
        json: true,
        headers: { cookie: sessionCookie.toString() },
      });

      const profile: {
        ok: boolean;
        userCtx: { name: null | string; roles: string[] };
      } = response.body;

      if (!profile.ok || !profile.userCtx.name) {
        ll('No or anonymous profile %o', profile);
        return cb(false, 401, 'Not authenticated');
      }

      log('info %O', profile.userCtx);
      sessions.set(info.req, {
        name: profile.userCtx.name,
        roles: profile.userCtx.roles,
      });

      return cb(true);
    } catch (e) {
      ll('Network / profile error', e);
      return cb(false, 500, 'Not authorized');
    }
  },
});

wss.on('connection', (ws, req) => {
  const session = sessions.get(req)!;

  ws.on('message', message => {
    console.log('received: %s', message);
  });

  ws.send(`Hello ${session.name}`);
});

const compiler = webpack(webpackConfig);
if (isDevelopment) {
  // Tell express to use the webpack-dev-middleware and use the webpack.config.js
  // configuration file as a base.
  const devMiddleware = webpackDevMiddleware(compiler, {
    // noInfo: true,
    publicPath: webpackConfig.output!.publicPath!,
  });
  app.use((req, res, next) => {
    const reqPath = req.url;
    // console.log('GET ', reqPath);
    // find the file that the browser is looking for
    const file = reqPath.split('/').pop()!;

    if (
      file.match(
        /^(index\.html)|(.*\.bundle\.js)|(.*\.worker\.js)|(.*\.hot-update\.js(on)?)|(precache-manifest\..*\.js)$/
      )
    ) {
      res.contentType(file);
      res.end(
        devMiddleware.fileSystem.readFileSync(
          path.join(webpackConfig.output!.path!, file)
        )
      );
    } else if (file.indexOf('.') === -1 && !file.match(/^__webpack_hmr$/)) {
      // if the url does not have an extension, assume they've navigated to something like /home and want index.html
      res.end(
        devMiddleware.fileSystem.readFileSync(
          path.join(webpackConfig.output!.path!, 'index.html')
        )
      );
    } else {
      next();
    }
  });
  app.use(
    webpackHotMiddleware(compiler, {
      reload: true,
    })
  );
}

// Serve the files on port 3000.
server.listen(3000, () => {
  log('PokaYoka listening on port 3000!\n');
});
