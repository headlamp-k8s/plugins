import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import { isOpenCostInstalled } from './request';

type Conf = {
  isEnabledInListView: boolean;
  namespace: string;
  serviceURL: string;
  defaultTimespan: string;
  displayCurrency: string;
};

export function getConfigStore(): ConfigStore<Conf> {
  return new ConfigStore<Conf>('@headlamp-k8s/opencost');
}

export async function getServiceDetails(): Promise<[string, string]> {
  const configStore = getConfigStore();

  const config = configStore.get();

  if (config?.serviceURL) {
    return [config?.namespace, config?.serviceURL];
  }

  const [installed, name, namespace] = await isOpenCostInstalled();
  if (installed) {
    return [namespace, name];
  }
  return ['', ''];
}

export function getDisplayCurrency(): string {
  const configStore = getConfigStore();
  const config = configStore.get();

  return config?.displayCurrency ?? '$';
}

export function getDisplayTimespan(): string {
  const configStore = getConfigStore();
  const config = configStore.get();

  return config?.defaultTimespan ?? '14d';
}
