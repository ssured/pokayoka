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

if (isDevelopment) {
  // Tell express to use the webpack-dev-middleware and use the webpack.config.js
  // configuration file as a base.
  app.use(
    webpackDevMiddleware(compiler, {
      // noInfo: true,
      publicPath: webpackConfig.output!.publicPath!,
    })
  );
  app.use(
    webpackHotMiddleware(compiler, {
      reload: true,
    })
  );
}

app.use(wsRouterFor(getWss()));

// Serve the files on port 3000.
app.listen(3000, () => {
  console.log('PokaYoka listening on port 3000!\n');
});

startServer();
