import path from 'path';
import webpack from 'webpack';

import HtmlWebpackPlugin from 'html-webpack-plugin'; // tslint:disable-line import-name
import CleanWebpackPlugin from 'clean-webpack-plugin'; // tslint:disable-line import-name

const isProduction = false;

const config: webpack.Configuration = {
  entry: {
    main: ['./src/index', 'webpack-hot-middleware/client'],
    worker: ['./src/worker/index'],
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

    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      title: 'Output Management',
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
