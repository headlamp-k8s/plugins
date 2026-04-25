import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getRepoRoot } from './git.js';

export function getPluginPath(pluginName: string): string {
  const repoRoot = getRepoRoot();
  const pluginPath = path.join(repoRoot, pluginName);

  if (!fs.existsSync(pluginPath)) {
    console.error(chalk.red(`Error: Plugin directory "${pluginName}" does not exist`));
    process.exit(1);
  }

  const packageJsonPath = path.join(pluginPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red(`Error: No package.json found in "${pluginName}" directory`));
    process.exit(1);
  }

  return pluginPath;
}

export function getAllPlugins(): string[] {
  const repoRoot = getRepoRoot();
  const items = fs.readdirSync(repoRoot, { withFileTypes: true });

  const plugins: string[] = [];

  for (const item of items) {
    if (item.isDirectory() && !item.name.startsWith('.') && !item.name.startsWith('@')) {
      const pluginPath = path.join(repoRoot, item.name);
      const packageJsonPath = path.join(pluginPath, 'package.json');

      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          // Check if it has plugin-related scripts or dependencies
          if (packageJson.scripts &&
              (packageJson.scripts.package ||
               packageJson.scripts.build ||
               packageJson.keywords?.includes('headlamp-plugin'))) {
            plugins.push(item.name);
          }
        } catch (error) {
          // Skip invalid package.json files
        }
      }
    }
  }

  return plugins.sort();
}

export function getPluginInfo(pluginPath: string): { name: string; version: string } {
  const packageJsonPath = path.join(pluginPath, 'package.json');

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return {
      name: packageJson.name || path.basename(pluginPath),
      version: packageJson.version || '0.0.0'
    };
  } catch (error) {
    console.error(chalk.red(`Error reading package.json in ${pluginPath}`));
    process.exit(1);
  }
}

export function findTarball(pluginPath: string, pluginName: string, version?: string): string | null {
  const files = fs.readdirSync(pluginPath);

  const tarballFiles = files.filter(file =>
    (file.endsWith('.tgz') || file.endsWith('.tar.gz')) &&
    file.includes(pluginName)
  );

  if (tarballFiles.length === 0) {
    return null;
  }

  if (version) {
    const exactMatch = tarballFiles.find(file => file.includes(version));
    if (exactMatch) {
      return path.join(pluginPath, exactMatch);
    }
  }

  // Return the most recent tarball (by filename)
  tarballFiles.sort();
  return path.join(pluginPath, tarballFiles[tarballFiles.length - 1]);
}
