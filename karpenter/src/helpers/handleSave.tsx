import { clusterAction } from '@kinvolk/headlamp-plugin/lib';
import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/K8s/KubeObject';
import yaml from 'js-yaml';

export interface SaveConfig {
  dispatch: any;
  currentResource: KubeObject;
  cancelUrl: string;
  closeDialog?: () => void;
  onError?: (error: any) => void;
  onConfirm?: () => void;
}

export function createHandleSave(config: SaveConfig) {
  return async (yamlContent: string) => {
    if (!config.currentResource) {
      console.error('No resource selected for saving');
      return;
    }

    const parsed = yaml.load(yamlContent) as KubeObjectInterface;
    const itemName = config.currentResource.metadata.name;

    config.closeDialog?.();

    try {
      await config.dispatch(
        clusterAction(() => config.currentResource.update(parsed), {
          startMessage: `Applying changes to ${itemName}…`,
          cancelledMessage: `Cancelled changes to ${itemName}.`,
          successMessage: `Applied changes to ${itemName}.`,
          errorMessage: `Failed to apply changes to ${itemName}.`,
          cancelUrl: config.cancelUrl,
          errorUrl: config.cancelUrl,
        })
      );

      if (config.onConfirm) {
        config.onConfirm();
      }
    } catch (err: any) {
      console.error(err.message);
      config.onError?.(err);
    }
  };
}

interface GetHandleSaveParams {
  dispatch: any;
  currentResource: KubeObject;
  cancelUrl: string;
  closeDialog: () => void;
  onError?: (err: any) => void;
  onConfirm?: () => void;
}

export function getHandleSaveHelper({
  dispatch,
  currentResource,
  cancelUrl,
  closeDialog,
  onError = err => console.error('Save failed:', err),
  onConfirm,
}: GetHandleSaveParams) {
  return createHandleSave({
    dispatch,
    currentResource,
    cancelUrl,
    closeDialog,
    onError,
    onConfirm,
  });
}
