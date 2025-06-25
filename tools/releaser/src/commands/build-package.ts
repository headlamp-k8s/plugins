import chalk from 'chalk';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getPluginPath, getPluginInfo, findTarball } from '../utils/plugin';

interface PackageOptions {
  outputDir?: string;
}

export function packagePlugin(pluginName: string, options: PackageOptions = {}): void {
  console.log(chalk.blue(`📦 Creating package for plugin "${pluginName}"...\n`));

  const pluginPath = getPluginPath(pluginName);
  const info = getPluginInfo(pluginPath);

  console.log(chalk.dim(`Plugin: ${info.name}`));
  console.log(chalk.dim(`Version: ${info.version}`));
  console.log(chalk.dim(`Path: ${pluginPath}\n`));

  try {
    // Check if the plugin has a package script
    const packageJson = JSON.parse(fs.readFileSync(path.join(pluginPath, 'package.json'), 'utf-8'));

    if (!packageJson.scripts || !packageJson.scripts.package) {
      console.error(chalk.red(`❌ Plugin "${pluginName}" does not have a "package" script in package.json`));
      console.error(chalk.red('Please add a package script like: "package": "headlamp-plugin package"'));
      process.exit(1);
    }

    // Run npm run package
    console.log(chalk.blue('🔨 Running npm run package...'));
    execSync('npm run package', {
      stdio: 'inherit',
      cwd: pluginPath,
      timeout: 120000 // 2 minute timeout
    });

    // Find the generated tarball
    const tarballPath = findTarball(pluginPath, pluginName, info.version);

    if (!tarballPath) {
      console.log(chalk.yellow('⚠️  Package command completed, but could not find generated tarball'));
      console.log(chalk.dim('The tarball might be in a different location or have a different naming pattern'));
      return;
    }

    console.log(chalk.green(`✅ Package created successfully: ${path.basename(tarballPath)}`));

    // Move to output directory if specified
    if (options.outputDir) {
      const outputDir = path.resolve(options.outputDir);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const targetPath = path.join(outputDir, path.basename(tarballPath));
      fs.copyFileSync(tarballPath, targetPath);
      console.log(chalk.green(`✅ Copied to: ${targetPath}`));
    }

    // Show file stats
    const stats = fs.statSync(tarballPath);
    const sizeInKB = Math.round(stats.size / 1024);
    console.log(chalk.dim(`📊 Package size: ${sizeInKB} KB`));

    console.log(chalk.green(`\n🎉 Plugin "${pluginName}" packaged successfully!`));
    console.log(chalk.dim(`\nNext steps:`));
    console.log(chalk.dim(`  • Create release: plugin-releaser release ${pluginName} ${info.version}`));

  } catch (error) {
    console.error(chalk.red('❌ Error creating package:'));
    console.error(error);
    process.exit(1);
  }
}
