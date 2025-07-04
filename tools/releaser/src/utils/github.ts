import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { createReleaseTag } from './git';

const OWNER = 'headlamp-k8s';
const REPO = 'plugins';

export function getOwnerAndRepo() {
  return { owner: OWNER, repo: REPO };
}

interface ReleaseAsset {
  id: number;
  name: string;
  size: number;
  browser_download_url: string;
  state: string;
  content_type: string;
}

interface GitHubRelease {
  id: number;
  name: string | null;
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  assets: ReleaseAsset[];
}

export function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error(chalk.red('Error: GITHUB_TOKEN environment variable is not set'));
    console.error('Please set the GITHUB_TOKEN environment variable with a GitHub personal access token');
    process.exit(1);
  }

  return new Octokit({
    auth: token
  });
}

export async function getRelease(tagName: string): Promise<GitHubRelease | null> {
  try {
    const octokit = getOctokit();
    const { data: release } = await octokit.repos.getReleaseByTag({
      owner: OWNER,
      repo: REPO,
      tag: tagName
    });
    return release;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getReleaseByName(releaseName: string): Promise<GitHubRelease | null> {
  try {
    const octokit = getOctokit();
    const { data: releases } = await octokit.repos.listReleases({
      owner: OWNER,
      repo: REPO,
      per_page: 100 // Get more releases to search through
    });

    const release = releases.find(r => r.name === releaseName);
    return release || null;
  } catch (error: any) {
    console.error(chalk.yellow(`Warning: Could not search for release by name: ${error.message}`));
    return null;
  }
}

export async function createDraftRelease(
  pluginName: string,
  version: string,
  releaseBody?: string,
  targetCommit?: string
): Promise<GitHubRelease> {
  const octokit = getOctokit();

  const releaseName = `${pluginName} v${version}`;
  const tagName = `${pluginName}-${version}`;
  const defaultBody = `Release of ${pluginName} plugin version ${version}`;

  try {
    // Create a draft release with a tag name and target commit
    // GitHub will create the tag when the release is published, not when it's drafted
    const releaseParams: any = {
      owner: OWNER,
      repo: REPO,
      tag_name: tagName,
      name: releaseName,
      body: releaseBody || defaultBody,
      draft: true,
      prerelease: false
    };

    // If we have a target commit, use it to specify which commit the tag should point to
    if (targetCommit) {
      releaseParams.target_commitish = targetCommit;
    }

    const { data: release } = await octokit.repos.createRelease(releaseParams);

    return release;
  } catch (error) {
    console.error(chalk.red(`Error creating draft release: ${error}`));
    throw error;
  }
}

export async function uploadAssetToRelease(
  releaseId: number,
  assetPath: string,
  assetName?: string
): Promise<void> {
  const octokit = getOctokit();

  if (!fs.existsSync(assetPath)) {
    throw new Error(`Asset file does not exist: ${assetPath}`);
  }

  const assetFileName = assetName || path.basename(assetPath);
  const assetData = fs.readFileSync(assetPath);

  try {
    await octokit.repos.uploadReleaseAsset({
      owner: OWNER,
      repo: REPO,
      release_id: releaseId,
      name: assetFileName,
      data: assetData as any
    });

    console.log(chalk.green(`✅ Uploaded ${assetFileName} to release`));
  } catch (error) {
    console.error(chalk.red(`Error uploading asset ${assetFileName}: ${error}`));
    throw error;
  }
}

export async function publishRelease(releaseId: number): Promise<void> {
  const octokit = getOctokit();

  try {
    await octokit.repos.updateRelease({
      owner: OWNER,
      repo: REPO,
      release_id: releaseId,
      draft: false
    });

    console.log(chalk.green('✅ Release published successfully'));
  } catch (error) {
    console.error(chalk.red(`Error publishing release: ${error}`));
    throw error;
  }
}

export function createTag(pluginName: string, version: string): string {
  try {
    const tagName = createReleaseTag(pluginName, version);
    console.log(chalk.green(`✅ Created tag ${tagName} for ${pluginName} v${version}`));
    return tagName;
  } catch (error) {
    console.error(chalk.red(`Error creating tag for ${pluginName} v${version}: ${error}`));
    throw error;
  }
}
