import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import path from 'path';
import ReplaceInFileWebpackPlugin from 'replace-in-file-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';

import grafanaConfig from './.config/webpack/webpack.config';
import { getPluginJson } from './.config/webpack/utils';

// The plugin is distributed as `plugins/<plugin-id>/`. The Go backend (Magefile.go), the packaging
// targets (Makefile) and compose.yaml all rely on that path, so it must not change silently.
// It is declared here rather than in .config/webpack/constants.ts because everything under
// .config/ is scaffolded by `@grafana/create-plugin` and is overwritten by `create-plugin update`.
const DIST_DIR = `plugins/${getPluginJson().id}`;

const config = async (env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  const newConfig = merge(baseConfig, {
    // update output configuration
    // other configurations stay the same
    output: {
      ...baseConfig.output,
      path: path.resolve(process.cwd(), DIST_DIR),
      clean: {
        keep: new RegExp(`(.*?_(amd64|arm(64)?|s390x)(.exe)?|go_plugin_build_manifest)`),
      },
    },
  });

  // `ReplaceInFileWebpackPlugin` captures its target directory at construction time, so
  // redirecting `output.path` is not enough on its own: left alone it would look for
  // plugin.json/README.md in the scaffolded default directory and the %VERSION%, %TODAY% and
  // %PLUGIN_ID% placeholders would ship unreplaced.
  newConfig.plugins
    ?.filter((plugin) => plugin instanceof ReplaceInFileWebpackPlugin)
    .forEach((plugin) => {
      (plugin as { options: Array<{ dir: string }> }).options.forEach((option) => {
        option.dir = DIST_DIR;
      });
    });

  // Replace, rather than merge into, the scaffolded minimizer: webpack runs every entry of
  // `optimization.minimizer`, so a merged-in second TerserPlugin would minify the output twice.
  // `terserOptions` mirrors .config/webpack/webpack.config.ts; `extractComments` is the local
  // addition. It collapses the per-chunk `*.js.LICENSE.txt` files into a single notice file whose
  // name cannot be mistaken for the plugin's own LICENSE (AGPL-3.0), while keeping the `banner`
  // reference that links each minified chunk to the third-party notices it carries.
  newConfig.optimization = {
    ...newConfig.optimization,
    minimizer: [
      new TerserPlugin({
        extractComments: {
          filename: 'THIRD-PARTY-LICENSES.txt',
        },

        terserOptions: {
          format: {
            comments: (_, { type, value }) => type === 'comment2' && value.trim().startsWith('[create-plugin]'),
          },
          compress: {
            drop_console: ['log', 'info'],
          },
        },
      }),
    ],
  };

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
