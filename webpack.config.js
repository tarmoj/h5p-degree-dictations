const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const MinifyPlugin = require("babel-minify-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const nodeEnv = process.env.NODE_ENV || 'development';
const isDev = (nodeEnv !== 'production');

const config = {
  mode: 'development',
  optimization: {
    minimizer: [
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'h5p-degree-dictations.css'
    }),
    new MiniCssExtractPlugin({
      filename: 'joubel-ui.css'
    }),
    new MiniCssExtractPlugin({
      filename: 'joubel-slider.css'
    }),
    new MiniCssExtractPlugin({
      filename: 'joubel-simple-rounded-button.css'
    }),
    new MinifyPlugin({}, {
      sourceMap: isDev
    })
  ],
  entry: {
    dist: './src/entries/h5p-degree-dictations.js'
  },
  output: {
    filename: 'h5p-degree-dictations.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['@babel/env']
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ],
      },
      {
        test: /\.svg|\.jpg|\.png$/,
        include: path.join(__dirname, 'src/images'),
        loader: 'file-loader?name=images/[name].[ext]'
      },
      {
        test: /\.woff$/,
        include: path.join(__dirname, 'src/fonts'),
        loader: 'file-loader?name=fonts/[name].[ext]'
      }
    ]
  },
  stats: {
    colors: true
  },
  performance: {
    hints: false,
  }
};

if (isDev) {
  config.devtool = 'cheap-module-eval-source-map';
}

module.exports = config;
