import debug from 'debug';

import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import proxy from 'express-http-proxy';
import http from 'http';

import webpack from 'webpack';
import webpackConfig from '../webpack.config';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import nano from 'nano';
import { Channel, fromEmitter } from 'queueable';
import { storeRoutes } from './store';
import { addTunnel } from './expose-localtunnel';

import session from 'express-session';
import dotenv from 'dotenv';

import passport from 'passport';
import { Strategy as Auth0Strategy } from 'passport-auth0';
import { userInViews } from './middleware/user-in-views';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { registerWssServer } from './wss';

dotenv.config();

(async function() {
  await new Promise(res => setTimeout(res, 1000));

  const log = debug(__filename.replace(__dirname, '~'));

  const app = express();
  const server = http.createServer(app);

  const isProduction = app.get('env') === 'production';
  const isDevelopment = !isProduction;

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
  app.use(
    session({
      secret: 'K4P744%c!M^K',
      cookie: { secure: isProduction },
      resave: false,
      saveUninitialized: true,
    })
  );

  // Configure Passport to use Auth0
  const strategy = new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN!,
      clientID: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      callbackURL:
        process.env.AUTH0_CALLBACK_URL ||
        'http://localhost:3000/auth/auth0callback',
    },
    (accessToken, refreshToken, extraParams, profile, done) => {
      // accessToken is the token to call Auth0 API (not needed in the most cases)
      // extraParams.id_token has the JSON Web Token
      // profile has all the information from the user
      return done(null, profile);
    }
  );
  passport.use(strategy);
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  app.use(userInViews());
  app.use('/', authRouter);
  app.use('/', userRouter);
  registerWssServer(server);

  storeRoutes(app);
  addTunnel(app, 3000);

  const couchDbUrl = 'http://localhost:5984';
  app.use('/db', proxy(couchDbUrl, {}));

  // const nanoServer = nano(couchDbUrl.replace('://', '://admin:admin@'));
  // const validatedWebSocketProfiles = new WeakMap<
  //   http.IncomingMessage,
  //   UserProfile
  // >();

  // /*const wss = */ createServer(
  //   {
  //     server,
  //     verifyClient: async (info, cb) => {
  //       const ll = log.extend('verifyClient');

  //       const cookieHeader = info.req.headers.cookie;
  //       if (!cookieHeader) {
  //         ll('Failed to authorize ');
  //         return cb(false, 401, 'Not authorized');
  //       }

  //       const sessionCookie = Cookie.parse(cookieHeader);

  //       if (!sessionCookie) {
  //         ll('AuthSession not found in cookie %o', cookieHeader);
  //         return cb(false, 401, 'Not authorized');
  //       }

  //       try {
  //         // ll('cookie %o', sessionCookie.toString());
  //         const response = await got('_session', {
  //           baseUrl: couchDbUrl,
  //           json: true,
  //           headers: { cookie: sessionCookie.toString() },
  //         });

  //         const profile: {
  //           ok: boolean;
  //           userCtx: Partial<UserProfile>;
  //         } = response.body;

  //         if (!profile.ok || !profile.userCtx.name) {
  //           ll('No or anonymous profile %o', profile);
  //           return cb(false, 401, 'Not authenticated');
  //         }

  //         log('info %O', profile.userCtx);
  //         validatedWebSocketProfiles.set(
  //           info.req,
  //           profile.userCtx as UserProfile
  //         );

  //         return cb(true);
  //       } catch (e) {
  //         ll('Network / profile error', e);
  //         return cb(false, 500, 'Not authorized');
  //       }
  //     },
  //   },
  //   (clientStream, request) => {
  //     const profile = validatedWebSocketProfiles.get(request)!;
  //     const server = muxServer(nanoServer, profile);
  //     const serverStream = server.createStream();
  //     pull(clientStream, serverStream, clientStream);
  //   }
  // );

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
    const devMiddleware = webpackDevMiddleware(compiler as any, {
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
      } else if (
        /*file.indexOf('.') === -1 &&*/ !file.match(/^__webpack_hmr$/)
      ) {
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
      webpackHotMiddleware(compiler as any, {
        reload: true,
      })
    );
  }
  // Serve the files on port 3000.
  server.listen(3000, () => {
    log('PokaYoka listening on port 3000!\n');
  });

  // The following code documents how to use async iterators
  // this can fully replace pull-streams
  // for timing examples see https://docs.google.com/presentation/d/1r2V1sLG8JSSk8txiLh4wfTkom-BoOsk52FgPBy8o3RM/edit
  async function* changes(db: nano.DocumentScope<{}>) {
    const feed = db.follow({ since: 'now' });
    // @ts-ignore
    feed.follow();
    try {
      yield* fromEmitter(() => new Channel<nano.DatabaseChangesResultItem>())(
        'change',
        feed
      );
    } finally {
      // @ts-ignore
      feed.stop();
    }
  }

  console.log('started listening');
  console.log('YOYOYOYOYO');

  // make sure some default users exist
  const users = nano('http://admin:admin@localhost:5984').use<{
    name: string;
    password?: string;
    type: string;
    roles: string[];
  }>('_users');
  const allUsers = (await users.list({ include_docs: true })).rows
    .map(row => row.doc!)
    .filter(doc => Array.isArray(doc.roles));
  const createUsers = {
    'sjoerd@weett.nl': 'sjoerd',
    'sander@pokayoka.com': 'sander',
  };
  for (const [name, password] of Object.entries(createUsers)) {
    if (allUsers.find(user => user.name === name) == null) {
      // insert the new user
      await users.insert({
        _id: `org.couchdb.user:${name}`,
        name,
        password,
        roles: [],
        type: 'user',
      });
      console.log(`Added ${name} to the users db`);
    }
  }

  // for await (const change of changes(nanoServer.use('bk0wb0a7sz'))) {
  //   console.log(JSON.stringify(change, null, 2));
  //   break;
  // }
})();
