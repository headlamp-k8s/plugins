import chalk from 'chalk';
import path from 'path';
import inquirer from 'inquirer';
import { getPluginPath, getPluginInfo, findTarball } from '../utils/plugin';
import { sanitizeVersion, validateVersion } from '../utils/version';
import {
  getChangelogForPlugin,
  getVersionBumpCommit,
  validateCommitSha,
  isCommitPushedToRemote,
  createTagIfNotExists,
  pushTagIfNotOnRemote
} from '../utils/git';
import {
  getRelease,
  getReleaseByName,
  createDraftRelease,
  uploadAssetToRelease,
  getOwnerAndRepo,
  publishRelease
} from '../utils/github';

interface ReleaseOptions {
  tarball?: string;
  publish?: boolean;
  noTarball?: boolean;
}

export async function releasePlugin(
  pluginName: string,
  releaseVersion?: string,
  options: ReleaseOptions = {}
): Promise<void> {
  const pluginPath = getPluginPath(pluginName);
  const info = getPluginInfo(pluginPath);

  // Use version from package.json if not provided
  const version = releaseVersion ? sanitizeVersion(releaseVersion) : info.version;

  if (!validateVersion(version)) {
    console.error(chalk.red(`Error: "${version}" is not a valid semantic version`));
    console.error(chalk.red('Please use format: X.Y.Z (e.g., 1.0.0)'));
    process.exit(1);
  }

  console.log(chalk.blue(`🚀 Starting release process for plugin "${pluginName}" version ${version}...\n`));

  // If a version was provided, verify it matches package.json
  if (releaseVersion && info.version !== version) {
    console.error(chalk.red(`❌ Version mismatch!`));
    console.error(chalk.red(`Plugin package.json version: ${info.version}`));
    console.error(chalk.red(`Release version: ${version}`));
    console.error(chalk.red(`\nPlease update the plugin version first using:`));
    console.error(chalk.red(`plugin-releaser bump ${pluginName} ${version}`));
    process.exit(1);
  }

  // If no version was provided, we're using the package.json version
  if (!releaseVersion) {
    console.log(chalk.dim(`Using version from package.json: ${version}`));
  }

  let tarballPath: string | undefined;

  // Only handle tarball if --no-tarball is not specified
  if (!options.noTarball) {
    if (options.tarball) {
      tarballPath = path.resolve(options.tarball);
      if (!require('fs').existsSync(tarballPath)) {
        console.error(chalk.red(`❌ Specified tarball does not exist: ${tarballPath}`));
        process.exit(1);
      }
    } else {
      const foundTarball = findTarball(pluginPath, pluginName, version);
      if (!foundTarball) {
        console.error(chalk.red(`❌ Could not find tarball for ${pluginName} v${version}`));
        console.error(chalk.red(`Please create a package first using:`));
        console.error(chalk.red(`plugin-releaser package ${pluginName}`));
        process.exit(1);
      }
      tarballPath = foundTarball;
    }
  }

  console.log(chalk.dim(`Plugin: ${info.name}`));
  console.log(chalk.dim(`Version: ${version}`));
  if (tarballPath) {
    console.log(chalk.dim(`Tarball: ${path.basename(tarballPath)}`));
  } else {
    console.log(chalk.dim(`Tarball: Skipped (--no-tarball)`));
  }
  console.log('');

  try {
    const tagName = `${pluginName}-${version}`;

    console.log(chalk.blue('📝 Generating changelog...'));
    const changelog = getChangelogForPlugin(pluginName);
    const releaseBody = `## New Changes\n${changelog}`;

    console.log(chalk.blue('🔍 Checking for existing release...'));
    let existingRelease = await getRelease(tagName);

    // If no release found by tag, check for draft release by name
    if (!existingRelease) {
      const releaseName = `${pluginName} v${version}`;
      existingRelease = await getReleaseByName(releaseName);
      if (existingRelease && existingRelease.draft) {
        console.log(chalk.yellow(`⚠️  Found existing draft release: ${releaseName}`));
      } else if (existingRelease) {
        console.log(chalk.yellow(`⚠️  Found existing published release: ${releaseName}`));
      }
    }

    let releaseId: number;

    if (existingRelease) {
      console.log(chalk.yellow(`⚠️  Release for ${existingRelease.draft ? 'draft ' : ''}${tagName} already exists`));
      releaseId = existingRelease.id;

      // Check if tarball is already uploaded (only if we have a tarball to upload)
      if (tarballPath) {
        const tarballName = path.basename(tarballPath);
        const existingAsset = existingRelease.assets.find(asset =>
          asset.name === tarballName
        );

        if (existingAsset) {
          console.log(chalk.yellow('⚠️  Tarball already uploaded to this release'));

          const { overwrite } = await inquirer.prompt([{
            type: 'confirm',
            name: 'overwrite',
            message: 'Do you want to overwrite the existing asset?',
            default: false
          }]);

          if (!overwrite) {
            console.log(chalk.blue('ℹ️  Skipping asset upload'));
            // Continue with the release process without uploading a new tarball
            // Set tarballPath to undefined to skip upload
            tarballPath = undefined;
          } else {
            console.log(chalk.blue('🗑️  Deleting existing asset...'));
            const { getOctokit } = require('../utils/github');
            const octokit = getOctokit();
            const { owner, repo } = getOwnerAndRepo();
            await octokit.repos.deleteReleaseAsset({
              owner,
              repo,
              asset_id: existingAsset.id
            });
            console.log(chalk.green('✅ Existing asset deleted'));
          }
        }
      }
    } else {
      console.log(chalk.blue('📝 Creating draft release...'));

      // Find the commit that bumped the version for this plugin
      console.log(chalk.blue('🔍 Finding version bump commit...'));
      const versionBumpCommit = getVersionBumpCommit(pluginName, version);

      let targetCommit: string | undefined;

      if (versionBumpCommit) {
        console.log(chalk.dim(`Found commit: ${versionBumpCommit}`));

        // Validate that the commit exists locally
        if (validateCommitSha(versionBumpCommit)) {
          console.log(chalk.dim(`✅ Commit exists locally: ${versionBumpCommit}`));

          // Check if the commit exists on the remote (required for GitHub API)
          if (isCommitPushedToRemote(versionBumpCommit)) {
            targetCommit = versionBumpCommit;
            console.log(chalk.dim(`✅ Commit exists on remote: ${versionBumpCommit}`));
          } else {
            console.log(chalk.yellow(`⚠️  Commit ${versionBumpCommit} not pushed to remote yet, using current HEAD`));
            console.log(chalk.dim('💡 Tip: Push your commits first, then run the release command to use the exact version bump commit'));
            targetCommit = undefined;
          }
        } else {
          console.log(chalk.yellow(`⚠️  Commit ${versionBumpCommit} does not exist locally, using current HEAD`));
          targetCommit = undefined;
        }
      } else {
        console.log(chalk.yellow('⚠️  Could not find version bump commit, using current HEAD'));
        targetCommit = undefined;
      }

      const newRelease = await createDraftRelease(pluginName, version, releaseBody, targetCommit);
      releaseId = newRelease.id;
      console.log(chalk.green(`✅ Created draft release: ${newRelease.name}`));
    }

    // Upload tarball only if we have one
    if (tarballPath) {
      console.log(chalk.blue('📦 Uploading tarball to release...'));
      await uploadAssetToRelease(releaseId, tarballPath);

      if (existingRelease) {
        console.log(chalk.green('✅ Updated existing release with new tarball!'));
      } else {
        console.log(chalk.green('✅ Draft release created successfully with tarball!'));
      }
    } else {
      if (existingRelease) {
        console.log(chalk.green('✅ Using existing release (no tarball attached)!'));
      } else {
        console.log(chalk.green('✅ Draft release created successfully (no tarball attached)!'));
      }
    }

    // Handle publish logic if --publish option is provided
    if (options.publish) {
      const tagName = `${pluginName}-${version}`;

      console.log(chalk.blue('\n🏷️  Managing tags and publishing release...'));

      // 1. Create tag if it doesn't exist (uses existing one if it exists)
      console.log(chalk.blue('🔍 Checking for existing tag...'));
      createTagIfNotExists(pluginName, version);

      // 2. Push tag to remote if not already there
      pushTagIfNotOnRemote(tagName);

      // 3. Publish the release
      if (existingRelease && !existingRelease.draft) {
        console.log(chalk.yellow('⚠️  Release is already published, skipping publish step'));
      } else {
        console.log(chalk.blue('📤 Publishing release...'));
        await publishRelease(releaseId);
        console.log(chalk.green('✅ Release published successfully!'));
      }

      console.log(chalk.green('\n🎉 Release process completed successfully!'));
      const { owner, repo } = getOwnerAndRepo();
      console.log(chalk.dim(`View at: https://github.com/${owner}/${repo}/releases/tag/${tagName}`));
    } else {
      console.log(chalk.dim('\nThe release is currently in draft mode.'));
      const { owner, repo } = getOwnerAndRepo();
      console.log(chalk.dim(`Or visit: https://github.com/${owner}/${repo}/releases`));
    }

    console.log(chalk.green(`\n🎉 Release process completed successfully!`));

  } catch (error) {
    console.error(chalk.red('❌ Error during release process:'));
    console.error(error);
    process.exit(1);
  }
}
