import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import * as yaml from 'js-yaml';
import { getPluginPath, getPluginInfo } from './plugin.js';
import { getOwnerAndRepo } from './github.js';

interface ArtifactHubConfig {
  version: string;
  name: string;
  displayName: string;
  createdAt?: string;
  logoURL?: string;
  description: string;
  annotations: {
    'headlamp/plugin/archive-url': string;
    'headlamp/plugin/archive-checksum': string;
    'headlamp/plugin/version-compat'?: string;
    'headlamp/plugin/distro-compat'?: string;
  };
}

/**
 * Calculate SHA256 checksum of a file
 */
function calculateChecksum(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Get the versioned directory path for a plugin release.
 * Layout: <plugin>/<version>/artifacthub-pkg.yml
 */
export function getVersionDir(pluginName: string, version: string): string {
  const pluginPath = getPluginPath(pluginName);
  return path.join(pluginPath, version);
}

/**
 * Check if plugin has an artifacthub-pkg.yml file for the given version.
 * Falls back to checking the legacy top-level location.
 */
export function hasArtifactHubFile(pluginName: string, version?: string): boolean {
  if (version) {
    const versionDir = getVersionDir(pluginName, version);
    return fs.existsSync(path.join(versionDir, 'artifacthub-pkg.yml'));
  }

  // Check for any version directory containing an artifacthub-pkg.yml
  const pluginPath = getPluginPath(pluginName);
  const entries = fs.readdirSync(pluginPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && fs.existsSync(path.join(pluginPath, entry.name, 'artifacthub-pkg.yml'))) {
      return true;
    }
  }

  // Legacy: check top-level
  return fs.existsSync(path.join(pluginPath, 'artifacthub-pkg.yml'));
}

/**
 * Get the path to the artifacthub-pkg.yml file for a plugin version.
 */
export function getArtifactHubPath(pluginName: string, version?: string): string {
  if (version) {
    return path.join(getVersionDir(pluginName, version), 'artifacthub-pkg.yml');
  }

  // Legacy fallback
  const pluginPath = getPluginPath(pluginName);
  return path.join(pluginPath, 'artifacthub-pkg.yml');
}

/**
 * Find the latest version directory for a plugin by reading existing version folders.
 */
export function getLatestArtifactHubVersion(pluginName: string): string | null {
  const pluginPath = getPluginPath(pluginName);
  const entries = fs.readdirSync(pluginPath, { withFileTypes: true });
  const versions = entries
    .filter(e => e.isDirectory() && fs.existsSync(path.join(pluginPath, e.name, 'artifacthub-pkg.yml')))
    .map(e => e.name)
    .sort();
  return versions.length > 0 ? versions[versions.length - 1] : null;
}

/**
 * Read and parse the artifacthub-pkg.yml file for a given version.
 */
export function readArtifactHubConfig(pluginName: string, version?: string): ArtifactHubConfig | null {
  const artifactHubPath = getArtifactHubPath(pluginName, version);
  if (!fs.existsSync(artifactHubPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(artifactHubPath, 'utf-8');
    return yaml.load(content) as ArtifactHubConfig;
  } catch (error) {
    console.error(chalk.red(`Error reading artifacthub-pkg.yml for ${pluginName}:`));
    console.error(error);
    return null;
  }
}

/**
 * Update the artifacthub-pkg.yml file with new version and tarball information.
 * Creates a version directory (<plugin>/<version>/) and copies the README into it.
 */
export function updateArtifactHubConfig(
  pluginName: string,
  version: string,
  tarballPath: string
): void {
  const pluginPath = getPluginPath(pluginName);
  const pluginInfo = getPluginInfo(pluginPath);
  const { owner, repo } = getOwnerAndRepo();

  const versionDir = getVersionDir(pluginName, version);
  fs.mkdirSync(versionDir, { recursive: true });

  const artifactHubPath = path.join(versionDir, 'artifacthub-pkg.yml');

  // Calculate checksum of the tarball
  const checksum = calculateChecksum(tarballPath);
  const tarballName = path.basename(tarballPath);

  // Generate the GitHub release URL
  const archiveUrl = `https://github.com/${owner}/${repo}/releases/download/${pluginName}-${version}/${tarballName}`;

  let config: ArtifactHubConfig;

  // Try reading an existing config for this version, then fall back to the latest version
  const existingConfig = readArtifactHubConfig(pluginName, version)
    ?? readArtifactHubConfig(pluginName, getLatestArtifactHubVersion(pluginName) ?? undefined);

  if (existingConfig) {
    config = existingConfig;
    config.version = version;
    config.annotations['headlamp/plugin/archive-url'] = archiveUrl;
    config.annotations['headlamp/plugin/archive-checksum'] = `SHA256:${checksum}`;
  } else {
    config = {
      version,
      name: `headlamp_${pluginName.replace(/-/g, '_')}`,
      displayName: pluginInfo.name,
      description: `Headlamp plugin: ${pluginInfo.name}`,
      annotations: {
        'headlamp/plugin/archive-url': archiveUrl,
        'headlamp/plugin/archive-checksum': `SHA256:${checksum}`,
        'headlamp/plugin/version-compat': '>=0.22',
        'headlamp/plugin/distro-compat': 'in-cluster,web,docker-desktop,desktop'
      }
    };
  }

  // Write the updated config
  const yamlContent = yaml.dump(config, {
    indent: 2,
    quotingType: '"',
    forceQuotes: false
  });

  fs.writeFileSync(artifactHubPath, yamlContent);

  // Remove legacy top-level artifacthub-pkg.yml if it exists
  const legacyPath = path.join(pluginPath, 'artifacthub-pkg.yml');
  if (fs.existsSync(legacyPath)) {
    fs.unlinkSync(legacyPath);
    console.log(chalk.dim('Removed legacy top-level artifacthub-pkg.yml'));
  }

  // Copy README.md into the version directory
  const readmeSrc = path.join(pluginPath, 'README.md');
  if (fs.existsSync(readmeSrc)) {
    fs.copyFileSync(readmeSrc, path.join(versionDir, 'README.md'));
  }
}

/**
 * Create a template artifacthub-pkg.yml file for a plugin in a version directory.
 */
export function createArtifactHubTemplate(pluginName: string): void {
  const pluginPath = getPluginPath(pluginName);
  const pluginInfo = getPluginInfo(pluginPath);
  const version = pluginInfo.version;

  const versionDir = getVersionDir(pluginName, version);
  const artifactHubPath = path.join(versionDir, 'artifacthub-pkg.yml');

  if (fs.existsSync(artifactHubPath)) {
    throw new Error(`artifacthub-pkg.yml already exists for ${pluginName} v${version}`);
  }

  fs.mkdirSync(versionDir, { recursive: true });

  const template: Partial<ArtifactHubConfig> = {
    version,
    name: `headlamp_${pluginName.replace(/-/g, '_')}`,
    displayName: pluginInfo.name,
    createdAt: new Date().toISOString(),
    description: `Headlamp plugin: ${pluginInfo.name}`,
    annotations: {
      'headlamp/plugin/archive-url': 'TBD - will be updated during release',
      'headlamp/plugin/archive-checksum': 'TBD - will be updated during release',
      'headlamp/plugin/version-compat': '>=0.22',
      'headlamp/plugin/distro-compat': 'in-cluster,web,docker-desktop,desktop'
    }
  };

  const yamlContent = yaml.dump(template, {
    indent: 2,
    quotingType: '"',
    forceQuotes: false
  });

  fs.writeFileSync(artifactHubPath, yamlContent);

  // Copy README.md into the version directory
  const readmeSrc = path.join(pluginPath, 'README.md');
  if (fs.existsSync(readmeSrc)) {
    fs.copyFileSync(readmeSrc, path.join(versionDir, 'README.md'));
  }
}
