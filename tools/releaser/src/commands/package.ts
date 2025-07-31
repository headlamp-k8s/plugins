import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { getPluginPath, getPluginInfo } from '../utils/plugin.js';

interface PackageOptions {
  outputDir?: string;
}

export function packagePlugin(pluginName: string, options: PackageOptions = {}): void {
  console.log(chalk.blue(`📦 Creating package for plugin "${pluginName}"...\n`));

  const pluginPath = getPluginPath(pluginName);
  const info = getPluginInfo(pluginPath);
  const outputDir = options.outputDir || pluginPath;

  // Check if plugin has package script
  const packageJsonPath = path.join(pluginPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  if (!packageJson.scripts || !packageJson.scripts.package) {
    console.error(chalk.red(`Error: Plugin "${pluginName}" does not have a "package" script in package.json`));
    console.error(chalk.red('Please add a "package" script to the plugin package.json'));
    process.exit(1);
  }

  console.log(chalk.dim(`Plugin: ${info.name}`));
  console.log(chalk.dim(`Version: ${info.version}`));
  console.log(chalk.dim(`Output directory: ${outputDir}\n`));

  try {
    console.log(chalk.blue('🔨 Running npm run package...'));
    execSync('npm run package', {
      stdio: 'inherit',
      cwd: pluginPath,
      timeout: 120000 // secs
    });

    const files = fs.readdirSync(pluginPath);
    const tarballFiles = files.filter(file =>
      (file.endsWith('.tgz') || file.endsWith('.tar.gz')) &&
      (file.includes(pluginName) || file.includes(info.name.replace('@headlamp-k8s/', '')))
    );

    if (tarballFiles.length === 0) {
      console.log(chalk.yellow('⚠️  No tarball files found after packaging.'));
      console.log(chalk.dim('The package script may have completed, but the tarball location is unknown.'));
    } else {
      console.log(chalk.green('✅ Package created successfully!'));
      console.log(chalk.dim('\nGenerated files:'));
      tarballFiles.forEach(file => {
        const filePath = path.join(pluginPath, file);
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`  📄 ${file} (${sizeKB} KB)`);
      });
    }

    if (outputDir !== pluginPath && tarballFiles.length > 0) {
      console.log(chalk.blue(`📁 Moving tarballs to ${outputDir}...`));
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      tarballFiles.forEach(file => {
        const srcPath = path.join(pluginPath, file);
        const destPath = path.join(outputDir, file);
        fs.renameSync(srcPath, destPath);
        console.log(chalk.green(`✅ Moved ${file} to ${outputDir}`));
      });
    }

    console.log(chalk.green(`\n🎉 Plugin "${pluginName}" packaged successfully!`));

  } catch (error) {
    console.error(chalk.red('❌ Error creating package:'));
    console.error(error);
    process.exit(1);
  }
}
