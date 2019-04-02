import path from 'path';
import webpack from 'webpack';

import HtmlWebpackPlugin from 'html-webpack-plugin'; // tslint:disable-line import-name
import CleanWebpackPlugin from 'clean-webpack-plugin'; // tslint:disable-line import-name
import CopyWebpackPlugin from 'copy-webpack-plugin'; // tslint:disable-line import-name
import WorkboxPlugin from 'workbox-webpack-plugin';

const isProduction = false;

const config: webpack.Configuration = {
  entry: {
    main: ['babel-polyfill', './src/index', 'webpack-hot-middleware/client'],
    worker: ['./src/worker/index'],
    // sw: ['./src/worker-service/index'],
  },
  // devtool: "inline-source-map",
  mode: 'development', // "production"
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    globalObject: 'this',
  },
  plugins: (isProduction
    ? []
    : [new webpack.HotModuleReplacementPlugin()]
  ).concat([
    // new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.NoEmitOnErrorsPlugin(),

    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'Output Management',
    }),
    new CopyWebpackPlugin([
      {
        from: './src/worker-service/index.js',
        to: `${path.resolve(__dirname, 'dist')}/sw.bundle.js`,
      },
    ]),
    new WorkboxPlugin.InjectManifest({
      swDest: `${path.resolve(__dirname, 'dist')}/sw.bundle.js`,
      swSrc: './src/worker-service/index.js',
      // importWorkboxFrom: 'local',
      // maxsimumFileSizeToCacheInBytes: 10 * 1024 * 1024,
    }),
  ]),
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  module: {
    rules: [
      {
        // Include ts, tsx, and js files.
        test: /\.(tsx?)|(js)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          babelrc: true,
          cacheDirectory: true,
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {},
          },
        ],
      },
    ],
  },
};

// tslint:disable-next-line no-default-export
export default config;

// // tslint:disable-next-line no-default-export
// export default (env, argv) => {
//   if (argv.mode === "development") {
//     config.mode = "development";
//     config.devtool = "inline-source-map"; // https://webpack.js.org/guides/development/
//     console.log("running WebPack in development mode");
//   }

//   if (argv.mode === "production") {
//   }

//   return config;
// };
