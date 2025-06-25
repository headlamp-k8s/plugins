import chalk from 'chalk';

/**
 * Sanitizes a version string by removing any leading 'v' if present.
 * Warns the user if the input contained a leading 'v'.
 *
 * @param version The version string to sanitize
 * @returns The sanitized version string
 */
export function sanitizeVersion(version: string): string {
  if (version.startsWith('v')) {
    const sanitized = version.substring(1);
    console.log(chalk.yellow(`Warning: Version "${version}" contains a leading 'v'. The 'v' prefix has been removed.`));
    console.log(chalk.yellow(`Using version "${sanitized}" instead.`));
    return sanitized;
  }
  return version;
}

/**
 * Validates that a version string follows semantic versioning
 */
export function validateVersion(version: string): boolean {
  const semverRegex = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?$/;
  return semverRegex.test(version);
}
