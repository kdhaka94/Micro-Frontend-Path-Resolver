const {
  merge
} = require('webpack-merge');
const {
  join
} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const commonConfig = require('./webpack.common');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const dependencies = require('../package.json').dependencies;
const APP_JS = 'app/index.js';
const dotenvConfig = require('dotenv').config();
const devConfig = {
  mode: 'development',
  output: {
    publicPath: process.env.DASHBOARD_MFE_URL
  },
  entry: ['webpack-hot-middleware/client?reload=true', join(process.cwd(), APP_JS)],
  devServer: {
    port: 8085,
    historyApiFallback: {
      index: '/index.html'
    }
  },
  plugins: [new ModuleFederationPlugin({
    name: process.env.DASHBOARD_MFE_NAME,
    filename: process.env.REMOTE_ENTRY,
    exposes: {
      "./components/Something": "./app/components/Something",
      "./selectors": "./app/selectors"
    },
    remotes: {
      ShellMfe: `${process.env.SHELL_MFE_NAME}@${process.env.SHELL_MFE_URL}${process.env.REMOTE_ENTRY}`,
      CommonMfe: `${process.env.COMMON_MFE_NAME}@${process.env.COMMON_MFE_URL}${process.env.REMOTE_ENTRY}`
    },
    shared: {
      ...dependencies,
      react: {
        singleton: true,
        requiredVersion: dependencies['react']
      },
      'react-dom': {
        singleton: true,
        requiredVersion: dependencies['react-dom']
      }
    }
  }), new HtmlWebpackPlugin({
    template: './public/index.html'
  })]
};
module.exports = merge(commonConfig, devConfig);