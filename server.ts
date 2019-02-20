import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import proxy from 'express-http-proxy';
import WebSocket from 'ws';
import http from 'http';

import webpack from 'webpack';
import webpackConfig from './webpack.config';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import authRouter from './server/auth';

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

app.use('/db', proxy('http://localhost:5984', {}));

const wss = new WebSocket.Server({
  server,
});

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something');
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
  console.log('PokaYoka listening on port 3000!\n');
});
