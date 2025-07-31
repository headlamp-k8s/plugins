#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { bumpPlugin } from './commands/bump.js';
import { packagePlugin } from './commands/package.js';
import { releasePlugin } from './commands/release.js';
import { listPlugins } from './commands/list.js';
import { tagPlugin } from './commands/tag.js';
import { updateArtifactHub } from './commands/artifacthub.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

const program = new Command();

program.name('plugin-releaser')
  .description('Headlamp plugin release management tool')
  .version(version, '-v, --version', 'display version number');

program.command('list')
  .description('List all available plugins in the workspace')
  .option('--changed', 'Show only plugins with changes since their latest tag')
  .option('--verbose', 'Show detailed information including recent commits')
  .action(listPlugins);

program.command('bump')
  .description('Update plugin version, run npm install, and commit changes')
  .argument('<plugin>', 'Plugin name (directory name)')
  .argument('<version>', 'New version number (e.g., 0.2.0)')
  .option('--skip-install', 'Skip npm install step')
  .option('--skip-commit', 'Skip git commit step')
  .action(bumpPlugin);

program.command('package')
  .description('Create tarball package for plugin')
  .argument('<plugin>', 'Plugin name (directory name)')
  .option('--output-dir <dir>', 'Output directory for tarball (defaults to plugin directory)')
  .action(packagePlugin);

program.command('release')
  .description('Create a GitHub draft release and upload tarballs')
  .argument('<plugin>', 'Plugin name (directory name)')
  .argument('[version]', 'Release version (e.g., 0.2.0) - if not provided, uses version from package.json')
  .option('--tarball <path>', 'Path to tarball file (if not provided, will try to find it)')
  .option('--no-tarball', 'Skip tarball attachment to release')
  .option('--publish', 'Create/use existing tag, push to remote, and publish the release')
  .action(releasePlugin);

program.command('tag')
  .description('Create an annotated git tag for a plugin version')
  .argument('<plugin>', 'Plugin name (directory name)')
  .argument('[version]', 'Tag version (e.g., 0.2.0) - if not provided, uses version from package.json')
  .action(tagPlugin);

program.command('artifacthub')
  .description('Update or create artifacthub-pkg.yml file for a plugin')
  .argument('<plugin>', 'Plugin name (directory name)')
  .argument('[version]', 'Version (e.g., 0.2.0) - if not provided, uses version from package.json')
  .option('--tarball <path>', 'Path to tarball file (if not provided, will try to find it)')
  .option('--template', 'Create a new artifacthub-pkg.yml template file')
  .option('--no-commit', 'Skip git commit step')
  .action(updateArtifactHub);

program.parse();
