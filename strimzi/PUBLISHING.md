# Publishing Guide - Closed Source Distribution

This guide explains how to publish the Strimzi Headlamp Plugin as closed-source while keeping development code private.

## Overview

The plugin is distributed as compiled JavaScript only. Source code (TypeScript) is NOT included in the published package.

## Configuration Summary

- **License**: `UNLICENSED` (proprietary)
- **Package files**: Only `dist/`, `README.md`, `EULA.md`, and `LICENSE` are included
- **Source code**: Excluded via `.npmignore`
- **Repository**: Can be private or public (if public, users can see source but can't legally use it without your permission)

## Pre-Publishing Checklist

1. **Update version** in `package.json`
2. **Build the plugin**: `npm run build`
3. **Test locally** (see README.md)
4. **Review package contents**: `npm pack --dry-run`
5. **Update EULA.md** with your contact information

## Publishing Options

### Option 1: Publish to npm (Public Registry)

```bash
# Login to npm
npm login

# Build and pack
npm run pack:binary

# Verify package contents (should NOT include src/)
tar -tzf headlamp-k8s-plugin-strimzi-*.tgz

# Publish (compiled code only)
npm publish
```

**Note**: Even on public npm, only compiled `.js` files are published, not `.ts` source.

### Option 2: Publish to Private npm Registry

```bash
# Configure private registry
npm config set registry https://your-private-registry.com

# Login
npm login --registry=https://your-private-registry.com

# Publish
npm publish
```

### Option 3: GitHub Releases (No Source Code)

```bash
# Build the plugin
npm run pack:binary

# This creates: headlamp-k8s-plugin-strimzi-0.1.0.tgz
# Upload this .tgz file to GitHub Releases
```

### Option 4: Private Distribution

```bash
# Build the package
npm run pack:binary

# Distribute the .tgz file directly to customers
# They install with: npm install ./headlamp-k8s-plugin-strimzi-0.1.0.tgz
```

## Verifying Package Contents

Before publishing, always verify that source code is excluded:

```bash
# Create package
npm pack

# List contents (should NOT see src/ folder)
tar -tzf headlamp-k8s-plugin-strimzi-*.tgz

# Expected contents:
# package/dist/
# package/README.md
# package/LICENSE
# package/EULA.md
# package/package.json
```

## Repository Strategy

### Private Repository (Recommended for Closed Source)

```bash
# Make repository private on GitHub
# Only you and collaborators can see the source code
```

### Public Repository (Source Visible but Licensed)

If you want to show the plugin exists but keep it proprietary:

```bash
# Repository is public (source code visible)
# LICENSE file prevents others from using/copying
# Only compiled plugin is distributed via npm
```

Users can:
- See that the plugin exists
- Read the documentation
- See what features it has

Users CANNOT legally:
- Copy the source code
- Modify the source code
- Distribute the source code
- Use the source code without license

## Post-Publishing

After publishing:

1. **Tag the release** in git:
   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

2. **Create GitHub Release** with:
   - Release notes
   - The `.tgz` package file
   - Installation instructions

3. **Update documentation** with:
   - Installation command: `npm install @headlamp-k8s/plugin-strimzi`
   - Version compatibility
   - Changelog

## Security Best Practices

1. **Never commit**:
   - `.env` files with credentials
   - API keys
   - Private certificates

2. **Use `.gitignore`** to exclude sensitive files

3. **Use `.npmignore`** to exclude source code from published package

4. **Double-check** package contents before publishing

## Licensing Considerations

The current setup uses:
- `UNLICENSED` in package.json (proprietary)
- Custom proprietary LICENSE file
- EULA for end users

You may want to:
- Consult a lawyer for commercial distribution
- Add pricing/subscription terms
- Include terms of service
- Add warranty disclaimers specific to your jurisdiction

## Updating the Plugin

When releasing updates:

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Build and test
npm run build

# Publish
npm publish

# Tag and push
git push origin main --tags
```

## Troubleshooting

**Problem**: Source code appears in published package

**Solution**: Check `.npmignore` and `files` field in `package.json`

**Problem**: Users ask for source code

**Solution**: Point them to EULA and LICENSE. Offer commercial source licensing if desired.

**Problem**: Want to allow some users to see source

**Solution**: Create a separate licensing tier or contributor agreement

## Questions?

For publishing questions:
- npm documentation: https://docs.npmjs.com/
- GitHub Packages: https://docs.github.com/en/packages
