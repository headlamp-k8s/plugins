import yaml from 'js-yaml';

export function yamlToJSON(yamlObj: string) {
  const loadedYaml = yaml.loadAll(yamlObj);
  const normalizedObject = {};
  for (const parsedObject of loadedYaml) {
    if (Array.isArray(parsedObject)) {
      for (const object of parsedObject) {
        Object.assign(normalizedObject, object);
      }
    } else {
      Object.assign(normalizedObject, parsedObject);
    }
  }
  return normalizedObject;
}

export function jsonToYAML(jsonObj: any) {
  return yaml.dump(jsonObj);
}
