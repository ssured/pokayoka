import debug from 'debug';

import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import { Cookie } from 'tough-cookie';
import proxy from 'express-http-proxy';
import http from 'http';

import createServer from 'pull-ws/server';
import pull from 'pull-stream';
import { muxServer, UserProfile } from '../src/mux/server';

import webpack from 'webpack';
import webpackConfig from '../webpack.config';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import authRouter from './auth';
import got = require('got');
import nano = require('nano');

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

const nanoServer = nano(couchDbUrl.replace('://', '://admin:admin@'));
const validatedWebSocketProfiles = new WeakMap<
  http.IncomingMessage,
  UserProfile
>();

/*const wss = */ createServer(
  {
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
          userCtx: Partial<UserProfile>;
        } = response.body;

        if (!profile.ok || !profile.userCtx.name) {
          ll('No or anonymous profile %o', profile);
          return cb(false, 401, 'Not authenticated');
        }

        log('info %O', profile.userCtx);
        validatedWebSocketProfiles.set(
          info.req,
          profile.userCtx as UserProfile
        );

        return cb(true);
      } catch (e) {
        ll('Network / profile error', e);
        return cb(false, 500, 'Not authorized');
      }
    },
  },
  (clientStream, request) => {
    const profile = validatedWebSocketProfiles.get(request)!;
    const server = muxServer(nanoServer, profile);
    const serverStream = server.createStream();
    pull(clientStream, serverStream, clientStream);
  }
);

// wss.on('connection', (ws, req) => {
//   const profile = validatedWebSocketProfiles.get(req)!;

//   ws.on('message', message => {
//     console.log('received: %s', message);
//   });

//   ws.send(`Hello ${profile.name} ${profile.roles.join(', ')}`);
// });

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
