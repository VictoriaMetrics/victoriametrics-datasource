import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';

import grafanaConfig from './.config/webpack/webpack.config';

const config = async (env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  const newConfig = merge(baseConfig, {
    // update output configuration
    // other configurations stay the same
    output: {
      ...baseConfig.output,
      clean: {
        keep: new RegExp(`(.*?_(amd64|arm(64)?|s390x)(.exe)?|go_plugin_build_manifest)`),
      },
    },
  });

  // If typecheck-only, remove all plugins except ForkTsCheckerWebpackPlugin
  if (env.typecheckOnly) {
    return {
      ...newConfig,
      entry: {},  // empty entry
      plugins: [newConfig.plugins?.find(p => p instanceof ForkTsCheckerWebpackPlugin)],
    };
  }

  return newConfig;
};

export default config;
