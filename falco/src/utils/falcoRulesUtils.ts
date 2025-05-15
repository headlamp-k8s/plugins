import * as yaml from 'js-yaml';
import { FalcoRule } from '../types/FalcoRule';

// Falco config paths
export const FALCO_CONFIG_PATH = '/etc/falco/falco.yaml';
export const FALCO_RULES_FALLBACK = '/etc/falco/falco_rules.yaml';

/**
 * Extract rules_file entries from falco.yaml config.
 * Supports both singular and plural keys and alternatives.
 * @param configYaml - The YAML string content of falco.yaml
 * @returns Array of rules file paths
 */
export function getRulesFilesFromConfig(configYaml: string): string[] {
  try {
    const config = yaml.load(configYaml) as any;
    // Support both singular and plural keys, and possible alternatives
    const files =
      config?.rules_file || config?.rules_files || config?.rulesfile || config?.rulesfiles;
    if (files) {
      console.log(
        '[FalcoRules Debug] rules file key found:',
        config.rules_file
          ? 'rules_file'
          : config.rules_files
          ? 'rules_files'
          : config.rulesfile
          ? 'rulesfile'
          : config.rulesfiles
          ? 'rulesfiles'
          : 'unknown'
      );
      if (Array.isArray(files)) return files;
      if (typeof files === 'string') return [files];
    }
  } catch (err) {
    console.error('[FalcoRules Debug] YAML parse error in getRulesFilesFromConfig:', err);
  }
  return [];
}

/**
 * Extract all Falco rules from a YAML string (single or multi-doc).
 * @param yamlText The YAML content of the rules file.
 * @param source The pod:file source identifier.
 * @returns Array of FalcoRule objects.
 */
export function extractRulesFromYaml(yamlText: string, source: string): FalcoRule[] {
  const rules: FalcoRule[] = [];
  try {
    const docs = yaml.loadAll(yamlText);
    const findRules = (obj: any): void => {
      if (Array.isArray(obj)) {
        obj.forEach(findRules);
      } else if (obj && typeof obj === 'object') {
        if ('rule' in obj) {
          rules.push({
            name: String(obj.rule),
            desc: obj.desc || '',
            source,
          });
        }
        Object.values(obj).forEach(findRules);
      }
    };
    docs.forEach(findRules);
  } catch (err) {
    console.error('YAML parse error:', err);
  }
  return rules;
}

/**
 * Clean YAML text by removing non-printable characters and trailing JSON.
 * @param yamlText Raw YAML text from exec command
 * @returns Cleaned YAML text
 */
export function cleanYamlText(yamlText: string): string {
  // Remove ALL non-printable/control characters (except tab, newline, carriage return)
  let cleanText = yamlText.replace(/[^\t\n\r\x20-\x7E#]+/g, '');
  // Remove any trailing JSON object (e.g. {"metadata":{},"status":"Success"}) at the end of the string
  cleanText = cleanText.replace(/(\r?\n)+\{[\s\S]*?\}\s*$/g, '');
  return cleanText;
}

/**
 * Split a Falco rule source string into pod and file.
 * @param src Source string (format: podname:/path/to/file)
 * @returns Object with pod and file fields
 */
export function splitSource(src: string): { pod: string; file: string } {
  const idx = src.indexOf(':');
  return idx !== -1 ? { pod: src.slice(0, idx), file: src.slice(idx + 1) } : { pod: '', file: src };
}
