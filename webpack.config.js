const path = require('path');

module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: 'HuntJSClient',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      { test: /\.js$/, use: 'babel-loader' },
    ],
  },
};
