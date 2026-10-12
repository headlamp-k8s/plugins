import { PluginManager } from '@kinvolk/headlamp-plugin/lib';

/** Status payload returned by PluginManager.getStatus while an action runs. */
export type PluginManagerStatus = {
  type: string;
  message?: string;
};

/**
 * Polls PluginManager until the operation finishes, errors, or is cancelled.
 * Shared by PluginCard and Detail.
 */
export async function pollPluginManagerStatus(
  identifier: string,
  options: {
    isCancelled: () => boolean;
    shouldContinue: () => boolean;
    intervalMs?: number;
    onStatus?: (status: PluginManagerStatus) => void;
  }
): Promise<PluginManagerStatus | null> {
  const intervalMs = options.intervalMs ?? 1000;
  let status = (await PluginManager.getStatus(identifier)) as PluginManagerStatus | null;

  while (!options.isCancelled() && options.shouldContinue() && status) {
    options.onStatus?.(status);

    if (status.type === 'error' && status.message === 'No such operation in progress') {
      return status;
    }
    if (status.type === 'error' || status.type === 'success') {
      return status;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    status = (await PluginManager.getStatus(identifier)) as PluginManagerStatus | null;
  }

  return null;
}
