// webpack.config.js
/* eslint-env node */

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
require('dotenv').config();

const isDev = process.env.ENV === 'development';
const entry = ['./src/frontend/index.js'];

if (isDev) {
  // HMR para Webpack + Express con webpack-hot-middleware
  entry.push('webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true');
}

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry,

  output: {
    path: isDev ? '/' : path.resolve(__dirname, 'src/server/public'),
    filename: isDev ? 'assets/app.js' : 'assets/app-[contenthash].js',
    publicPath: '/',
    assetModuleFilename: 'assets/[hash][ext][query]'
  },

  resolve: {
    extensions: ['.js', '.jsx']
  },

  module: {
    rules: [
      // JavaScript / JSX
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },

      // SASS / CSS
      {
        test: /\.(s[ac]ss|css)$/i,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: isDev,
              importLoaders: 2,
              modules: false // usa true si prefieres CSS Modules
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: isDev
            }
          }
        ]
      },

      // Imágenes (png, jpg, gif, svg)
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource'
      },

      // Fuentes (opcional)
      {
        test: /\.(woff(2)?|ttf|eot)$/,
        type: 'asset/resource'
      }
    ]
  },

  devServer: {
    historyApiFallback: true,
    hot: true,
    port: 8000
  },

  plugins: [
    isDev ? new webpack.HotModuleReplacementPlugin() : () => { },

    new MiniCssExtractPlugin({
      filename: isDev ? 'assets/app.css' : 'assets/app-[contenthash].css'
    }),

    !isDev &&
    new CompressionPlugin({
      test: /\.(js|css)$/i,
      filename: '[path][base].gz',
      algorithm: 'gzip'
    }),

    !isDev && new WebpackManifestPlugin()
  ].filter(Boolean), // filtra los () => {} vacíos

  devtool: isDev ? 'eval-cheap-module-source-map' : false,
  stats: 'minimal'
};
