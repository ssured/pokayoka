import path from 'path';
import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import expressWs from 'express-ws';

import webpackConfig from './webpack.config';
import { wsRouterFor } from './server/websocket';

import { startServer } from './server/mux/server';

const { app, getWss } = expressWs(express());
const compiler = webpack(webpackConfig);

const isDevelopment = true;

app.use(wsRouterFor(getWss()));

if (isDevelopment) {
  // Tell express to use the webpack-dev-middleware and use the webpack.config.js
  // configuration file as a base.
  const devMiddleware = webpackDevMiddleware(compiler, {
    // noInfo: true,
    publicPath: webpackConfig.output!.publicPath!,
  });
  app.use((req, res, next) => {
    const reqPath = req.url;
    // find the file that the browser is looking for
    const file = reqPath.split('/').pop()!;

    if (
      file.match(
        /^(index\.html)|(.*\.bundle\.js)|(.*\.worker\.js)|(.*\.hot-update\.js(on)?)$/
      )
    ) {
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
app.listen(3000, () => {
  console.log('PokaYoka listening on port 3000!\n');
});

startServer();
