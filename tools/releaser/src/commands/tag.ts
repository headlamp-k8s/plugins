import chalk from 'chalk';
import { getPluginPath, getPluginInfo } from '../utils/plugin.js';
import { sanitizeVersion, validateVersion } from '../utils/version.js';
import { createTag } from '../utils/github.js';

export function tagPlugin(
  pluginName: string,
  tagVersion?: string,
): void {
  const pluginPath = getPluginPath(pluginName);
  const info = getPluginInfo(pluginPath);

  // Use version from package.json if not provided
  const version = tagVersion ? sanitizeVersion(tagVersion) : info.version;

  if (!validateVersion(version)) {
    console.error(chalk.red(`Error: "${version}" is not a valid semantic version`));
    console.error(chalk.red('Please use format: X.Y.Z (e.g., 1.0.0)'));
    process.exit(1);
  }

  console.log(chalk.blue(`🏷️  Creating tag for plugin "${pluginName}" version ${version}...\n`));

  // If a version was provided, verify it matches package.json
  if (tagVersion && info.version !== version) {
    console.log(chalk.yellow(`⚠️  Version mismatch!`));
    console.log(chalk.yellow(`Plugin package.json version: ${info.version}`));
    console.log(chalk.yellow(`Tag version: ${version}`));
    console.log(chalk.dim(`Creating tag for specified version: ${version}\n`));
  }

  // If no version was provided, we're using the package.json version
  if (!tagVersion) {
    console.log(chalk.dim(`Using version from package.json: ${version}\n`));
  }

  try {
    const tagName = createTag(pluginName, version);

    console.log(chalk.green(`\n🎉 Tag creation completed successfully!`));
    console.log(chalk.dim(`Tag name: ${tagName}`));
    console.log(chalk.dim(`Message: "Release ${pluginName} ${version}"`));
    console.log(chalk.dim('\n💡 Tip: Use "git push --tags" to push the tag to the remote repository'));

  } catch (error) {
    console.error(chalk.red('❌ Error during tag creation:'));
    console.error(error);
    process.exit(1);
  }
}
