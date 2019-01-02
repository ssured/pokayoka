const path = require('path');

module.exports = (baseConfig, env, config) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    // include: path.resolve(__dirname, '../src'),
    loader: require.resolve('babel-loader'),
    options: {
      presets: [['react-app', { flow: false, typescript: true }]],
    },
    use: [require.resolve('react-docgen-typescript-loader')],
  });
  config.resolve.extensions.push('.ts', '.tsx');
  return config;
};
