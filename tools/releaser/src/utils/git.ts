import { execSync, execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

export function getRepoRoot(): string {
  try {
    const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf-8' }).trim();
    return gitRoot;
  } catch (error) {
    console.error(chalk.red('Error: Not in a git repository'));
    process.exit(1);
  }
}

export function getPluginVersion(pluginPath: string): string {
  const packageJsonPath = path.join(pluginPath, 'package.json');

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch (error) {
    console.error(chalk.red(`Error: Could not read package.json in ${pluginPath}`));
    process.exit(1);
  }
}

export function commitPluginVersionChange(pluginName: string, version: string): void {
  const repoRoot = getRepoRoot();
  const pluginPath = path.join(repoRoot, pluginName);
  const packageJsonPath = path.join(pluginPath, 'package.json');
  const packageLockJsonPath = path.join(pluginPath, 'package-lock.json');

  try {
    execFileSync('git', ['add', packageJsonPath], { cwd: repoRoot });

    if (fs.existsSync(packageLockJsonPath)) {
      execFileSync('git', ['add', packageLockJsonPath], { cwd: repoRoot });
    }

    execFileSync('git', ['commit', '--signoff', '-m', `${pluginName}: Bump version to ${version}`], { cwd: repoRoot });
  } catch (error) {
    console.error(chalk.red('Error: Failed to commit version change'));
    console.error(error);
    process.exit(1);
  }
}

export function commitArtifactHubChange(pluginName: string, version: string, isTemplate: boolean = false): void {
  const repoRoot = getRepoRoot();
  const pluginPath = path.join(repoRoot, pluginName);
  const artifactHubPath = path.join(pluginPath, 'artifacthub-pkg.yml');

  try {
    execFileSync('git', ['add', artifactHubPath], { cwd: repoRoot });

    const action = isTemplate ? 'Create' : 'Update';
    const message = `${pluginName}: ${action} artifacthub-pkg.yml for version ${version}`;

    execFileSync('git', ['commit', '--signoff', '-m', message], { cwd: repoRoot });
  } catch (error) {
    console.error(chalk.red('Error: Failed to commit artifacthub changes'));
    console.error(error);
    process.exit(1);
  }
}

export function getVersionBumpCommit(pluginName: string, version: string): string | null {
  try {
    const repoRoot = getRepoRoot();
    const packageJsonPath = path.join(pluginName, 'package.json');

    // Look for the commit that last changed the package.json version to the target version
    // Use git log with -S to search for the specific version string in package.json
    const commits = execFileSync('git', ['log', '--format=%H', '-S', `"version": "${version}"`, '--', packageJsonPath], {
      encoding: 'utf-8',
      cwd: repoRoot
    }).trim();

    if (!commits) {
      // Fallback to looking for any commit that modified package.json recently
      const fallbackCommits = execFileSync('git', ['log', '--format=%H', '-1', '--', packageJsonPath], {
        encoding: 'utf-8',
        cwd: repoRoot
      }).trim();

      if (fallbackCommits) {
        const commitSha = fallbackCommits.split('\n')[0].trim();
        console.log(chalk.yellow(`⚠️  Could not find version bump commit, using latest package.json change: ${commitSha}`));
        return commitSha;
      }

      return null;
    }

    // Get the first (most recent) commit SHA
    const commitSha = commits.split('\n')[0].trim();

    return commitSha;
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Could not find version bump commit for ${pluginName}: ${error}`));
    return null;
  }
}

export function validateCommitSha(commitSha: string): boolean {
  // Validate that the commit exists in the repository
  try {
    const repoRoot = getRepoRoot();
    execFileSync('git', ['rev-parse', '--verify', commitSha], {
      cwd: repoRoot,
      stdio: 'pipe'
    });
    return true;
  } catch (error) {
    return false;
  }
}

export function isCommitPushedToRemote(commitSha: string, remoteName: string = 'origin'): boolean {
  // Simpler approach: try to fetch the specific commit from remote
  try {
    const repoRoot = getRepoRoot();

    // Try to verify that the commit exists on the remote by asking the remote directly
    execFileSync('git', ['cat-file', '-e', commitSha], {
      cwd: repoRoot,
      stdio: 'pipe'
    });

    // Now check if this commit is reachable from any remote branch
    const result = execFileSync('git', ['merge-base', '--is-ancestor', commitSha, `${remoteName}/HEAD`], {
      cwd: repoRoot,
      stdio: 'pipe'
    });

    return true;
  } catch (error) {
    // If the merge-base command fails, the commit is not an ancestor of remote HEAD
    // This likely means it hasn't been pushed yet
    return false;
  }
}

export function createReleaseTag(pluginName: string, version: string): string {
  try {
    const repoRoot = getRepoRoot();
    const tagName = `${pluginName}-${version}`;
    execFileSync('git', ['tag', '-a', tagName, '-m', `${pluginName} ${version}`], { cwd: repoRoot });
    return tagName;
  } catch (error) {
    console.error(chalk.red(`Error: Failed to create tag for ${pluginName}-${version}`));
    console.error(error);
    process.exit(1);
  }
}

export function pushTag(tagName: string): void {
  try {
    const repoRoot = getRepoRoot();
    execFileSync('git', ['push', 'origin', tagName], { cwd: repoRoot });
  } catch (error) {
    console.error(chalk.red(`Error: Failed to push tag ${tagName} to origin`));
    console.error(error);
    process.exit(1);
  }
}

export function checkGitStatus(): boolean {
    try {
        const repoRoot = getRepoRoot();
        const status = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], {
            encoding: 'utf-8',
            cwd: repoRoot
        }).trim();
        return status.length === 0;
    } catch (error) {
        return false;
    }
}

export function getLatestTagForPlugin(pluginName: string): string | null {
  try {
    const repoRoot = getRepoRoot();
    // Get all tags for the plugin in descending order (newest first)
    // Support both formats: plugin-name-version and plugin-name-v-version
    const tags = execFileSync('git', ['tag', '-l', `${pluginName}-*`, '--sort=-version:refname'], {
      encoding: 'utf-8',
      cwd: repoRoot
    }).trim();
    if (!tags) {
      return null;
    }

    const tagLines = tags.split('\n');
    return tagLines[0] || null;
  } catch (error) {
    return null;
  }
}

export function hasChangesInPluginSinceTag(pluginName: string, tagName: string): boolean {
  try {
    const repoRoot = getRepoRoot();
    // Check if there are any changes in the plugin directory since the tag
    const changes = execFileSync('git', ['diff', '--name-only', `${tagName}..HEAD`, '--', `${pluginName}/`], {
      encoding: 'utf-8',
      cwd: repoRoot
    }).trim();
    return changes.length > 0;
  } catch (error) {
    // If we can't determine changes, assume there are changes to be safe
    return true;
  }
}

export function hasChangesInPluginSinceLatestTag(pluginName: string): boolean {
  const latestTag = getLatestTagForPlugin(pluginName);

  if (!latestTag) {
    // No tag exists, so consider this as having changes
    return true;
  }

  return hasChangesInPluginSinceTag(pluginName, latestTag);
}

export function getCommitsSinceTag(pluginName: string, tagName: string): string[] {
  try {
    const repoRoot = getRepoRoot();
    const commits = execFileSync('git', ['log', '--oneline', '--cherry', '--topo-order', `${tagName}..HEAD`, '--', `${pluginName}/`], {
      encoding: 'utf-8',
      cwd: repoRoot
    }).trim();
    if (!commits) {
      return [];
    }
    return commits.split('\n').filter(line => line.trim().length > 0);
  } catch (error) {
    return [];
  }
}

export function getChangelogForPlugin(pluginName: string): string {
  try {
    const latestTag = getLatestTagForPlugin(pluginName);

    if (!latestTag) {
      // No previous tag, get all commits for this plugin
      const repoRoot = getRepoRoot();
      const allCommits = execFileSync('git', ['log', '--oneline', 'HEAD', '--', `${pluginName}/`], {
        encoding: 'utf-8',
        cwd: repoRoot
      }).trim();
      return allCommits || 'No changes found.';
    }

    const commits = getCommitsSinceTag(pluginName, latestTag);
    return commits.length > 0 ? commits.join('\n') : 'No changes since last release.';
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Could not generate changelog for ${pluginName}: ${error}`));
    return 'Could not generate changelog.';
  }
}

export function tagExists(tagName: string, checkRemote: boolean = false): boolean {
  try {
    const repoRoot = getRepoRoot();

    if (checkRemote) {
      execFileSync('git', ['ls-remote', '--tags', 'origin', tagName], {
        cwd: repoRoot,
        stdio: 'ignore'
      });
    } else {
      execFileSync('git', ['rev-parse', '--verify', tagName], {
        cwd: repoRoot,
        stdio: 'ignore'
      });
    }

    return true;
  } catch (error) {
    return false;
  }
}

export function createTagIfNotExists(pluginName: string, version: string): string {
  const tagName = `${pluginName}-${version}`;

  if (tagExists(tagName)) {
    console.log(chalk.yellow(`⚠️  Tag ${tagName} already exists locally`));
    return tagName;
  }

  return createReleaseTag(pluginName, version);
}

export function pushTagIfNotOnRemote(tagName: string): void {
  if (tagExists(tagName, true)) {
    console.log(chalk.yellow(`⚠️  Tag ${tagName} already exists on remote`));
    return;
  }

  console.log(chalk.blue(`📤 Pushing tag ${tagName} to remote...`));
  pushTag(tagName);
  console.log(chalk.green(`✅ Tag ${tagName} pushed to remote`));
}
