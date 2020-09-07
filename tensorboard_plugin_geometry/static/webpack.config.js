const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    render: './src/index.ts',
  },
  devtool: 'inline-source-map',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.html$/,
        loader: 'vue-template-loader',
        // We don't want to pass `src/index.html` file to this loader.
        exclude: /index.html/,
        options: {
          transformToRequire: {
            img: 'src'
          }
        },
      }
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'bundle'),
  }
};