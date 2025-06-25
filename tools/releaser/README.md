# Headlamp Plugin Releaser

A command-line tool for managing Headlamp plugin releases. This tool helps automate the process of versioning, packaging, and releasing Headlamp plugins.

For releasing a plugin, please read the [Workflow for Releasing a Plugin](#workflow-for-releasing-a-plugin) section below.

## Features

- **List plugins**: Discover all plugins in the workspace
- **Version management**: Update plugin versions with automatic npm install and git commits
- **Package creation**: Build plugin tarballs using the plugin's package script
- **Git tagging**: Create annotated git tags for plugin versions
- **GitHub releases**: Create draft releases and upload tarballs to GitHub
- **ArtifactHub support**: Create and update `artifacthub-pkg.yml` files with correct URLs and checksums

## Installation

### From the tools/releaser directory:

```bash
cd tools/releaser
npm install
npm run build
npm link
```

This will make the `plugin-releaser` command available globally.

### Prerequisites

- Node.js and npm
- Git repository
- GitHub token (for release functionality)

## Setup

### GitHub Token

For release functionality, set your GitHub personal access token:

```bash
export GITHUB_TOKEN=your_github_token_here
```

The token needs the following permissions:
- `repo` (for creating releases and uploading assets)

## Usage

### List all plugins

```bash
# List all plugins
plugin-releaser list

# Show only plugins with changes since their latest tag
plugin-releaser list --changed

# Show detailed information including recent commits
plugin-releaser list --verbose

# Combine flags to show detailed info for only changed plugins
plugin-releaser list --changed --verbose
```

### Update plugin version

```bash
# Update version, run npm install, and commit changes
plugin-releaser bump <plugin-name> <version>

# Example
plugin-releaser bump prometheus 0.7.0

# Skip npm install
plugin-releaser bump prometheus 0.7.0 --skip-install

# Skip git commit
plugin-releaser bump prometheus 0.7.0 --skip-commit
```

### Create plugin package

```bash
# Create tarball using npm run package
plugin-releaser package <plugin-name>

# Example
plugin-releaser package prometheus

# Copy to specific output directory
plugin-releaser package prometheus --output-dir ./releases
```

### Create GitHub release

```bash
# Create draft release using version from package.json
plugin-releaser release <plugin-name>

# Create draft release with specific version (must match package.json)
plugin-releaser release <plugin-name> <version>

# Examples
plugin-releaser release prometheus                    # Uses version from package.json
plugin-releaser release prometheus 0.7.0             # Uses specified version (must match package.json)

# Use specific tarball file
plugin-releaser release prometheus --tarball ./prometheus-0.7.0.tar.gz
```

### Manage ArtifactHub files

```bash
# Create a new artifacthub-pkg.yml template
plugin-releaser artifacthub <plugin-name> --template

# Update existing artifacthub-pkg.yml with new version and tarball info
plugin-releaser artifacthub <plugin-name>

# Update with specific version
plugin-releaser artifacthub <plugin-name> <version>

# Use specific tarball file
plugin-releaser artifacthub <plugin-name> --tarball ./plugin-1.0.0.tar.gz

# Examples
plugin-releaser artifacthub prometheus --template     # Creates new artifacthub-pkg.yml
plugin-releaser artifacthub prometheus               # Updates with package.json version
plugin-releaser artifacthub prometheus 0.7.0         # Updates with specific version
```

### Create git tag

```bash
# Create an annotated git tag using version from package.json
plugin-releaser tag <plugin-name>

# Create an annotated git tag for a specific version
plugin-releaser tag <plugin-name> <version>

# Examples
plugin-releaser tag prometheus                       # Uses version from package.json
plugin-releaser tag prometheus 0.7.0                 # Creates tag for specific version
```

This will:
- Create an annotated git tag with format `<plugin-name>-<version>`
- Add annotation message: `"Release <plugin-name> <version>"`
- Validate the version format (semantic versioning)
- Display helpful tip about pushing tags to remote

## ArtifactHub Support

The tool provides comprehensive support for ArtifactHub package metadata:

### Creating a template

For new plugins, you can create an `artifacthub-pkg.yml` template:

```bash
plugin-releaser artifacthub my-plugin --template
```

This creates a basic template with:
- Plugin name and version from `package.json`
- Default description
- Placeholder URLs and checksums
- Standard Headlamp plugin annotations

### Manual updates

You can update the ArtifactHub file independently:

```bash
# Update with package.json version
plugin-releaser artifacthub my-plugin

# Update with specific version and tarball
plugin-releaser artifacthub my-plugin 1.2.0 --tarball ./my-plugin-1.2.0.tar.gz
```

### Push artifacthub-pkg.yml to GitHub

You have to manually commit and push the `artifacthub-pkg.yml` file to your GitHub repository after running the command. The tool does not automatically commit changes to this file.

## Plugin Requirements

For a directory to be recognized as a plugin, it must:

1. Have a `package.json` file
2. Have a `package` script in the `scripts` section, OR
3. Have `headlamp-plugin` in the `keywords` array

Example `package.json`:
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "scripts": {
    "package": "headlamp-plugin package"
  },
  "keywords": ["headlamp-plugin"]
}
```

## Commit Message Format

The tool follows this commit message format:
```
<plugin-name>: Bump version to <version>
```

For example:
```
prometheus: Bump version to 0.7.0
```

## Git Tag Format

Git tags follow this format:
```
<plugin-name>-<version>
```

For example:
```
prometheus-0.7.0
```

The tool automatically detects existing tags and supports both legacy formats:
- `plugin-name-version` (current format)

## Workflow for Releasing a Plugin

Here's the typical workflow for releasing a plugin:

1. **List available plugins**:
   ```bash
   plugin-releaser list
   ```

   or use the `--changed` flag to see only plugins with changes since their last tag:
   ```bash
   plugin-releaser list --changed
   ```

2. **Update the desired plugin version**:
   ```bash
   plugin-releaser bump my-plugin 1.2.0
   ```
   This will:
   - Update `package.json` with the new version
   - Run `npm install` to update `package-lock.json`
   - Create a git commit with format: `my-plugin: Bump version to 1.2.0`

3. **Create a package**:
   ```bash
   plugin-releaser package my-plugin
   ```

4. **Create a GitHub release**:
   ```bash
   plugin-releaser release my-plugin
   ```
   This will:
   - Generate a changelog from git history since the last tag
   - Find the commit where the version was bumped
   - Create a draft GitHub release pointing to that commit
   - Upload the tarball to the release

5. **Publish the release**:
   Before publishing, you **should** review the draft release on GitHub. If everything looks good, you can run the release command with the `--publish` flag to create a tag and publish the release:

   ```bash
   plugin-releaser release my-plugin --publish
   ```

   This will:
   - Create an annotated git tag `my-plugin-1.2.0`
   - Push the tag to the remote repository
   - Publish the GitHub release for the respective tag

Alternatively, if any of the steps above fails or needs to be refined, you can always run the commands again with the appropriate flags to adjust the process.