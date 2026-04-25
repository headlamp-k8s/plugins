import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/KubeObject';
import { jsonToYAML } from './jsonTOYAML';

export const handleShowDiff = (
  item: KubeObject,
  setCurrentResource,
  setOriginalYaml,
  setModifiedYaml,
  setIsEditorOpen
) => {
  if (!item || !item.jsonData) {
    return;
  }

  setCurrentResource(item);
  try {
    const original = jsonToYAML(item.jsonData);
    setOriginalYaml(original);
    setModifiedYaml(original);
    setIsEditorOpen(true);
  } catch (error) {
    console.error(error);
  }
};
