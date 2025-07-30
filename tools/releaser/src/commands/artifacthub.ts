import chalk from 'chalk';
import { getPluginPath, getPluginInfo, findTarball } from '../utils/plugin.js';
import { sanitizeVersion, validateVersion } from '../utils/version.js';
import { checkGitStatus, commitArtifactHubChange } from '../utils/git.js';
import {
  hasArtifactHubFile,
  updateArtifactHubConfig,
  createArtifactHubTemplate
} from '../utils/artifacthub.js';

interface UpdateArtifactHubOptions {
  tarball?: string;
  template?: boolean;
  noCommit?: boolean;
}

export function updateArtifactHub(
  pluginName: string,
  version?: string,
  options: UpdateArtifactHubOptions = {}
): void {
  const pluginPath = getPluginPath(pluginName);
  const info = getPluginInfo(pluginPath);

  // Use version from package.json if not provided
  const targetVersion = version ? sanitizeVersion(version) : info.version;

  if (!validateVersion(targetVersion)) {
    console.error(chalk.red(`Error: "${targetVersion}" is not a valid semantic version`));
    console.error(chalk.red('Please use format: X.Y.Z (e.g., 1.0.0)'));
    process.exit(1);
  }

  console.log(chalk.blue(`🔧 Updating artifacthub-pkg.yml for plugin "${pluginName}" version ${targetVersion}...\n`));

  // Check git status if we're going to commit
  if (!options.noCommit && !checkGitStatus()) {
    console.error(chalk.red('Error: Working directory is not clean. Please commit or stash your changes first.'));
    console.error(chalk.red('Or use --no-commit to skip git commit.'));
    process.exit(1);
  }

  // If template option is provided, create a new template
  if (options.template) {
    if (hasArtifactHubFile(pluginName)) {
      console.error(chalk.red(`❌ artifacthub-pkg.yml already exists for ${pluginName}`));
      console.error(chalk.red('Remove the existing file first or use without --template to update it'));
      process.exit(1);
    }

    try {
      createArtifactHubTemplate(pluginName);
      console.log(chalk.green('✅ Created artifacthub-pkg.yml template'));

      if (!options.noCommit) {
        console.log(chalk.blue('📝 Committing changes...'));
        commitArtifactHubChange(pluginName, targetVersion, true);
        console.log(chalk.green(`✅ Changes committed`));
      } else {
        console.log(chalk.dim('⏭️  Skipping git commit'));
      }

      console.log(chalk.dim('💡 You can edit this file manually to add logoURL, description, etc.'));
      console.log(chalk.dim('💡 Use the release command with --update-artifacthub to automatically update URLs and checksums'));
      return;
    } catch (error) {
      console.error(chalk.red('❌ Error creating artifacthub template:'));
      console.error(error);
      process.exit(1);
    }
  }

  // Check if artifacthub file exists
  if (!hasArtifactHubFile(pluginName)) {
    console.error(chalk.red(`❌ No artifacthub-pkg.yml found for ${pluginName}`));
    console.error(chalk.red('Create one first using:'));
    console.error(chalk.red(`plugin-releaser artifacthub ${pluginName} --template`));
    process.exit(1);
  }

  // Find tarball
  let tarballPath: string;

  if (options.tarball) {
    tarballPath = require('path').resolve(options.tarball);
    if (!require('fs').existsSync(tarballPath)) {
      console.error(chalk.red(`❌ Specified tarball does not exist: ${tarballPath}`));
      process.exit(1);
    }
  } else {
    const foundTarball = findTarball(pluginPath, pluginName, targetVersion);
    if (!foundTarball) {
      console.error(chalk.red(`❌ Could not find tarball for ${pluginName} v${targetVersion}`));
      console.error(chalk.red(`Please create a package first using:`));
      console.error(chalk.red(`plugin-releaser package ${pluginName}`));
      process.exit(1);
    }
    tarballPath = foundTarball;
  }

  console.log(chalk.dim(`Plugin: ${info.name}`));
  console.log(chalk.dim(`Version: ${targetVersion}`));
  console.log(chalk.dim(`Tarball: ${require('path').basename(tarballPath)}\n`));

  try {
    updateArtifactHubConfig(pluginName, targetVersion, tarballPath);
    console.log(chalk.green('✅ artifacthub-pkg.yml updated successfully!'));

    if (!options.noCommit) {
      console.log(chalk.blue('📝 Committing changes...'));
      commitArtifactHubChange(pluginName, targetVersion, false);
      console.log(chalk.green(`✅ Changes committed`));
    } else {
      console.log(chalk.dim('⏭️  Skipping git commit'));
    }

    console.log(chalk.dim('💡 The file now contains the updated version, archive URL, and checksum'));
  } catch (error) {
    console.error(chalk.red('❌ Error updating artifacthub-pkg.yml:'));
    console.error(error);
    process.exit(1);
  }
}
