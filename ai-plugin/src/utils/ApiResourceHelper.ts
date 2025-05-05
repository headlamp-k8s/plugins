import YAML from 'yaml';

/**
 * Ensures that a partial Kubernetes resource (like from a PATCH operation)
 * has enough information to be displayed nicely
 */
export function ensureFullResource(resource: any): any {
  // If we already have a complete resource, return it
  if (resource.apiVersion && resource.kind && resource.metadata) {
    return resource;
  }

  // Create a base structure if needed
  const result = { ...resource };
  
  // Add missing required fields
  if (!result.apiVersion) {
    result.apiVersion = resource.apiVersion || 'v1';
  }
  
  if (!result.kind) {
    result.kind = resource.kind || 'Resource';
  }
  
  if (!result.metadata) {
    result.metadata = {};
  }
  
  if (!result.metadata.name && resource.name) {
    result.metadata.name = resource.name;
  }
  
  return result;
}

/**
 * Generates nicely formatted YAML from a resource object
 */
export function generateYaml(resource: any): string {
  try {
    return YAML.stringify(resource);
  } catch (e) {
    console.error('Error generating YAML:', e);
    return JSON.stringify(resource, null, 2);
  }
}

/**
 * Parses content as YAML or JSON
 */
export function parseContent(content: string): any {
  try {
    // Try YAML first
    return YAML.parse(content);
  } catch (yamlErr) {
    try {
      // Then try JSON
      return JSON.parse(content);
    } catch (jsonErr) {
      throw new Error('Could not parse content as YAML or JSON');
    }
  }
}
