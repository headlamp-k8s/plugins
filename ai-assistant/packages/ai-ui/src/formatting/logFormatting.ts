/**
 * Pure utility functions for log formatting and language detection.
 *
 * These functions have no React, DOM, or UI-framework dependencies and
 * can be tested in isolation.
 */

/**
 * Detects whether logs contain JSON or structured key=value data and returns
 * the appropriate Monaco language identifier.
 *
 * @param logs - Raw log text.
 * @returns `"json"`, `"properties"`, or `"text"`.
 */
export function getLogLanguage(logs: string): string {
  if (!logs) return 'text';

  const jsonPattern = /^\s*[\{\[].*[\}\]]\s*$/m;
  const hasJson = jsonPattern.test(logs);

  const structuredLogPattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/m;
  const kvPattern = /(?:level|msg)=/m;
  const hasStructuredLogs = structuredLogPattern.test(logs) || kvPattern.test(logs);

  if (hasJson) return 'json';
  if (hasStructuredLogs) return 'properties';
  return 'text';
}

/**
 * Formats log text for display. JSON logs are pretty-printed with 2-space
 * indentation; multiple JSON objects on a single line are split apart.
 *
 * @param logs - Raw log text.
 * @returns Formatted log string.
 */
export function getFormattedLogs(logs: string): string {
  if (!logs) return 'No logs available';

  const language = getLogLanguage(logs);

  if (language === 'json') {
    try {
      const lines = logs.split('\n');
      const formattedLines = lines.map(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return line;

        if (trimmedLine.startsWith('{') && trimmedLine.includes('}')) {
          try {
            const jsonObjects: string[] = [];
            let currentJson = '';
            let braceCount = 0;
            let inString = false;
            let escapeNext = false;

            for (let i = 0; i < trimmedLine.length; i++) {
              const char = trimmedLine[i];
              currentJson += char;

              if (escapeNext) {
                escapeNext = false;
                continue;
              }

              if (char === '\\') {
                escapeNext = true;
                continue;
              }

              if (char === '"' && !escapeNext) {
                inString = !inString;
                continue;
              }

              if (!inString) {
                if (char === '{') {
                  braceCount++;
                } else if (char === '}') {
                  braceCount--;
                  if (braceCount === 0) {
                    try {
                      const parsed = JSON.parse(currentJson);
                      jsonObjects.push(JSON.stringify(parsed, null, 2));
                      currentJson = '';
                    } catch {
                      // Keep original if parsing fails
                    }
                  }
                }
              }
            }

            if (jsonObjects.length > 0) {
              return jsonObjects.join('\n\n');
            }

            const parsed = JSON.parse(trimmedLine);
            return JSON.stringify(parsed, null, 2);
          } catch {
            return line;
          }
        }
        return line;
      });

      return formattedLines.join('\n');
    } catch (error) {
      console.warn('Failed to format JSON logs:', error);
      return logs;
    }
  }

  return logs;
}

/**
 * Builds a human-readable title from the resource metadata.
 *
 * @param resourceType  - Kind of the resource (e.g. `"Pod"`).
 * @param resourceName  - Name of the resource.
 * @param containerName - Optional container name.
 * @param namespace     - Optional namespace.
 * @returns A title string such as `"Pod my-pod (container: app) Logs"`.
 */
export function buildLogTitle(
  resourceType: string,
  resourceName: string,
  containerName?: string,
  namespace?: string
): string {
  const parts = [resourceType];
  if (resourceName) {
    parts.push(resourceName);
  }
  if (containerName) {
    parts.push(`(container: ${containerName})`);
  } else if (namespace) {
    parts.push(`(${namespace})`);
  }
  parts.push('Logs');
  return parts.join(' ');
}
