import yaml from 'js-yaml';

export function jsonToYAML(json: any): string {
  try {
    return yaml.dump(json, { noRefs: true, indent: 2 });
  } catch (e) {
    console.error('Failed to convert JSON to YAML:', e);
    return '';
  }
}
