import chalk from 'chalk';
import { getAllPlugins, getPluginInfo, getPluginPath } from '../utils/plugin.js';
import {
  getLatestTagForPlugin,
  hasChangesInPluginSinceLatestTag,
  getCommitsSinceTag
} from '../utils/git.js';

interface ListOptions {
  changed?: boolean;
  verbose?: boolean;
}

export function listPlugins(options: ListOptions = {}): void {
  if (options.changed) {
    console.log(chalk.blue('🔍 Scanning for plugins with changes since latest tag...\n'));
  } else {
    console.log(chalk.blue('🔍 Scanning for Headlamp plugins...\n'));
  }

  const allPlugins = getAllPlugins();

  if (allPlugins.length === 0) {
    console.log(chalk.yellow('No plugins found in the workspace.'));
    return;
  }

  let plugins = allPlugins;

  if (options.changed) {
    plugins = allPlugins.filter(pluginName => {
      try {
        return hasChangesInPluginSinceLatestTag(pluginName);
      } catch (error) {
        // If we can't determine, include it to be safe
        return true;
      }
    });

    if (plugins.length === 0) {
      console.log(chalk.green('✅ No plugins have changes since their latest tag.'));
      return;
    }

    console.log(chalk.yellow(`Found ${plugins.length} plugin(s) with changes since latest tag:\n`));
  } else {
    console.log(chalk.green(`Found ${plugins.length} plugin(s):\n`));
  }

  plugins.forEach(pluginName => {
    try {
      const pluginPath = getPluginPath(pluginName);
      const info = getPluginInfo(pluginPath);
      const latestTag = getLatestTagForPlugin(pluginName);

      let statusLine = `  📦 ${chalk.bold(pluginName)} (${chalk.dim(info.version)})`;

      if (options.changed || options.verbose) {
        if (latestTag) {
          const hasChanges = hasChangesInPluginSinceLatestTag(pluginName);
          if (hasChanges) {
            statusLine += ` ${chalk.yellow('• has changes since')} ${chalk.dim(latestTag)}`;

            if (options.verbose) {
              const commits = getCommitsSinceTag(pluginName, latestTag);
              if (commits.length > 0) {
                statusLine += chalk.dim(` (${commits.length} commit${commits.length !== 1 ? 's' : ''})`);
              }
            }
          } else if (!options.changed) {
            statusLine += ` ${chalk.green('• up to date with')} ${chalk.dim(latestTag)}`;
          }
        } else {
          statusLine += ` ${chalk.cyan('• no tags found')}`;
        }
      }

      console.log(statusLine);

      if (options.verbose && latestTag) {
        const commits = getCommitsSinceTag(pluginName, latestTag);
        if (commits.length > 0) {
          commits.slice(0, 3).forEach(commit => {
            console.log(`    ${chalk.dim('└─')} ${chalk.dim(commit)}`);
          });
          if (commits.length > 3) {
            console.log(`    ${chalk.dim(`└─ ... and ${commits.length - 3} more commit${commits.length - 3 !== 1 ? 's' : ''}`)}`);
          }
        }
      }

    } catch (error) {
      console.log(`  📦 ${chalk.bold(pluginName)} ${chalk.red('(error reading info)')}`);
    }
  });

  if (options.changed && plugins.length > 0) {
    console.log(chalk.dim('\nThese plugins have changes and may need a new release.'));
  }

  console.log(chalk.dim('\nUse "plugin-releaser bump <plugin> <version>" to update a plugin version'));
  console.log(chalk.dim('Use "plugin-releaser package <plugin>" to create a tarball'));
  console.log(chalk.dim('Use "plugin-releaser release <plugin> <version>" to create a GitHub release'));
}
