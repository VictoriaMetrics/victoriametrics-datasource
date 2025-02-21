import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { merge } from 'webpack-merge';

import grafanaConfig from './.config/webpack/webpack.config';

const path = require('path');

// @ts-ignore
const config = (env) => {
  const defaultConfig = grafanaConfig(env);
  if (Array.isArray(defaultConfig.externals)) {
    defaultConfig.externals = defaultConfig.externals.filter((item) => item !== '@emotion/react');
  }

  return merge(defaultConfig, {
    output: {
      clean: false,
      path: path.resolve(__dirname, 'plugins/victoriametrics-metrics-datasource'),
      filename: '[name].js',
      // Keep publicPath relative for host.com/grafana/ deployments
      publicPath: '/public/plugins/victoriametrics-metrics-datasource/',
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
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(svg|ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/,
          type: 'asset/resource',
          generator: { filename: 'static/img/[name].[hash:8][ext]' },
        },
      ],
    },
    performance: { hints: false },
    plugins: [
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [
          path.join(__dirname, 'plugins/victoriametrics-metrics-datasource', '**/*.{js,css}'),
        ],
        cleanAfterEveryBuildPatterns: [
          '!**/*.bin', // don't clear backend build
        ],
      }),
    ]
  });
}

export default config;
