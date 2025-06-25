import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getPluginPath } from '../utils/plugin';
import { sanitizeVersion, validateVersion } from '../utils/version';
import { commitPluginVersionChange, checkGitStatus } from '../utils/git';

interface BumpOptions {
  skipInstall?: boolean;
  skipCommit?: boolean;
}

export function bumpPlugin(pluginName: string, newVersion: string, options: BumpOptions = {}): void {
  const version = sanitizeVersion(newVersion);

  if (!validateVersion(version)) {
    console.error(chalk.red(`Error: "${version}" is not a valid semantic version`));
    console.error(chalk.red('Please use format: X.Y.Z (e.g., 1.0.0)'));
    process.exit(1);
  }

  console.log(chalk.blue(`🔄 Starting version bump for plugin "${pluginName}" to ${version}...\n`));

  const pluginPath = getPluginPath(pluginName);
  const packageJsonPath = path.join(pluginPath, 'package.json');

  if (!options.skipCommit && !checkGitStatus()) {
    console.error(chalk.red('Error: Working directory is not clean. Please commit or stash your changes first.'));
    process.exit(1);
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const currentVersion = packageJson.version;

    console.log(chalk.dim(`Current version: ${currentVersion}`));
    console.log(chalk.dim(`New version: ${version}\n`));

    packageJson.version = version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(chalk.green(`✅ Updated ${pluginName}/package.json with version ${version}`));

    if (!options.skipInstall) {
      console.log(chalk.blue('📦 Running npm install...'));
      try {
        execSync('npm install', {
          stdio: 'inherit',
          cwd: pluginPath,
          timeout: 60000 // 60 second timeout
        });
        console.log(chalk.green('✅ npm install completed'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  npm install failed, but continuing...'));
        console.log(chalk.dim('You may need to run npm install manually in the plugin directory'));
      }
    } else {
      console.log(chalk.dim('⏭️  Skipping npm install'));
    }

    if (!options.skipCommit) {
      console.log(chalk.blue('📝 Committing changes...'));
      commitPluginVersionChange(pluginName, version);
      console.log(chalk.green(`✅ Changes committed with message "${pluginName}: Bump version to ${version}"`));
    } else {
      console.log(chalk.dim('⏭️  Skipping git commit'));
    }

    console.log(chalk.green(`\n🎉 Plugin "${pluginName}" version bumped to ${version} successfully!`));

    if (!options.skipCommit) {
      console.log(chalk.dim(`\nNext steps:`));
      console.log(chalk.dim(`  • Create package: plugin-releaser package ${pluginName}`));
      console.log(chalk.dim(`  • Create release: plugin-releaser release ${pluginName} ${version}`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error bumping plugin version:'));
    console.error(error);
    process.exit(1);
  }
}
