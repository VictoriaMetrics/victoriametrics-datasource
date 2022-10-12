import {merge} from 'webpack-merge';

import grafanaConfig from './.config/webpack/webpack.config';

// const CopyWebpackPlugin = require('copy-webpack-plugin');
// const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');

const config = (env) => {
  const defaultConfig = grafanaConfig(env);
  if (Array.isArray(defaultConfig.externals)) {
    defaultConfig.externals = defaultConfig.externals.filter((item) => item !== '@emotion/react');
  }

  return merge(defaultConfig, {
    output: {
      clean: true,
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      // Keep publicPath relative for host.com/grafana/ deployments
      publicPath: '/public/plugins/victoria-metrics/',
    },
    resolve: {
      alias: {
        app: path.resolve(__dirname, 'app/'),
        packages: path.resolve(__dirname, 'packages/'),
        img: path.resolve(__dirname, 'img/'),
      },
    },
    module: {
      rules: [
        {
          test: require.resolve('jquery'),
          loader: 'expose-loader',
          options: {
            exposes: ['$', 'jQuery'],
          },
        },
        {
          test: /\.html$/,
          exclude: /(index|error)\-template\.html/,
          use: [
            {
              loader: 'ngtemplate-loader?relativeTo=' + path.resolve(__dirname, '../../') + '&prefix=',
            },
            {
              loader: 'html-loader',
              options: {
                sources: false,
                minimize: {
                  removeComments: false,
                  collapseWhitespace: false,
                },
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(svg|ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/,
          type: 'asset/resource',
          generator: {filename: 'static/img/[name].[hash:8][ext]'},
        },
      ],
    },
    performance: {hints: false},
  });
}

export default config;
