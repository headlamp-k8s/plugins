import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import * as yaml from 'js-yaml';
import { getPluginPath, getPluginInfo } from './plugin';
import { getOwnerAndRepo } from './github';

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
 * Check if plugin has an artifacthub-pkg.yml file
 */
export function hasArtifactHubFile(pluginName: string): boolean {
  const pluginPath = getPluginPath(pluginName);
  const artifactHubPath = path.join(pluginPath, 'artifacthub-pkg.yml');
  return fs.existsSync(artifactHubPath);
}

/**
 * Get the path to the artifacthub-pkg.yml file for a plugin
 */
export function getArtifactHubPath(pluginName: string): string {
  const pluginPath = getPluginPath(pluginName);
  return path.join(pluginPath, 'artifacthub-pkg.yml');
}

/**
 * Read and parse the artifacthub-pkg.yml file
 */
export function readArtifactHubConfig(pluginName: string): ArtifactHubConfig | null {
  if (!hasArtifactHubFile(pluginName)) {
    return null;
  }

  const artifactHubPath = getArtifactHubPath(pluginName);
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
 * Update the artifacthub-pkg.yml file with new version and tarball information
 */
export function updateArtifactHubConfig(
  pluginName: string,
  version: string,
  tarballPath: string
): void {
  const artifactHubPath = getArtifactHubPath(pluginName);
  const pluginInfo = getPluginInfo(getPluginPath(pluginName));
  const { owner, repo } = getOwnerAndRepo();

  // Calculate checksum of the tarball
  const checksum = calculateChecksum(tarballPath);
  const tarballName = path.basename(tarballPath);

  // Generate the GitHub release URL
  const archiveUrl = `https://github.com/${owner}/${repo}/releases/download/${pluginName}-${version}/${tarballName}`;

  let config: ArtifactHubConfig;

  if (hasArtifactHubFile(pluginName)) {
    // Update existing config
    config = readArtifactHubConfig(pluginName)!;
    config.version = version;
    config.annotations['headlamp/plugin/archive-url'] = archiveUrl;
    config.annotations['headlamp/plugin/archive-checksum'] = `SHA256:${checksum}`;
  } else {
    // Create new config
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
}

/**
 * Create a template artifacthub-pkg.yml file for a plugin
 */
export function createArtifactHubTemplate(pluginName: string): void {
  const artifactHubPath = getArtifactHubPath(pluginName);
  const pluginInfo = getPluginInfo(getPluginPath(pluginName));

  if (fs.existsSync(artifactHubPath)) {
    throw new Error(`artifacthub-pkg.yml already exists for ${pluginName}`);
  }

  const template: Partial<ArtifactHubConfig> = {
    version: pluginInfo.version,
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
}
