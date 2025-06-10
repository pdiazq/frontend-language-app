// webpack.config.js
/* eslint-env node */

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin'); // nuevo nombre del plugin

require('dotenv').config();

const isDev = process.env.ENV === 'development';
const entry = ['./src/frontend/index.js'];

if (isDev) {
  // HMR para webpack-hot-middleware + Express
  entry.push('webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true');
}

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry,
  output: {
    path: isDev ? '/' : path.resolve(__dirname, 'src/server/public'),
    filename: isDev ? 'assets/app.js' : 'assets/app-[contenthash].js',
    publicPath: '/',          // URL base para los assets
    assetModuleFilename: 'assets/[hash][ext][query]' // salida estándar de asset/resource
  },

  resolve: {
    extensions: ['.js', '.jsx']
  },

  module: {
    rules: [
      // JS / JSX ─────────────────────────────────────────────
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },

      // SASS / CSS ───────────────────────────────────────────
      {
        test: /\.(s[ac]ss|css)$/i,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { sourceMap: isDev }
          },
          {
            loader: 'sass-loader',
            options: { sourceMap: isDev }
          }
        ]
      },

      // Imágenes y otros assets (nuevo en Webpack 5) ─────────
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource'
        // el nombre de archivo lo define `assetModuleFilename`
      }
    ]
  },

  // Sólo si usas webpack-dev-server directo (no Express). Lo mantenemos por compatibilidad
  devServer: {
    historyApiFallback: true,
    hot: true,
    port: 8000
  },

  plugins: [
    // HMR solo en desarrollo
    isDev ? new webpack.HotModuleReplacementPlugin() : () => { },

    // Extrae CSS en producción
    new MiniCssExtractPlugin({
      filename: isDev ? 'assets/app.css' : 'assets/app-[contenthash].css'
    }),

    // Comprensión gzip solo en producción
    isDev
      ? () => { }
      : new CompressionPlugin({
        test: /\.(js|css)$/i,
        filename: '[path][base].gz',
        algorithm: 'gzip'
      }),

    // Manifest para SSR en producción
    isDev ? () => { } : new WebpackManifestPlugin()
  ],

  // Fuente de mapa rápida en dev; completa en prod si lo necesitas
  devtool: isDev ? 'eval-cheap-module-source-map' : false,

  stats: 'minimal' // consola más limpia
};