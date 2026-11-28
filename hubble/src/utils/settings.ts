/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import { useMemo } from 'react';

/** The name plugin settings are stored under: the package name. */
export const PLUGIN_NAME = '@headlamp-k8s/hubble';

/** Where the hubble-flows-adapter Service is in the cluster. */
export interface AdapterService {
  namespace: string;
  name: string;
  /** A port name or number of the Service. */
  port: string;
}

/** What adapter/deploy/hubble-flows-adapter.yaml creates. */
export const DEFAULT_ADAPTER_SERVICE: AdapterService = {
  namespace: 'kube-system',
  name: 'hubble-flows-adapter',
  port: 'http',
};

/** The plugin's saved settings. Fields left empty use the defaults. */
export interface HubbleSettings {
  adapterNamespace?: string;
  adapterName?: string;
  adapterPort?: string;
}

export function getConfigStore() {
  return new ConfigStore<HubbleSettings>(PLUGIN_NAME);
}

/** The adapter Service from the settings, with the defaults for what isn't set. */
export function adapterServiceFrom(settings: HubbleSettings | null | undefined): AdapterService {
  return {
    namespace: settings?.adapterNamespace?.trim() || DEFAULT_ADAPTER_SERVICE.namespace,
    name: settings?.adapterName?.trim() || DEFAULT_ADAPTER_SERVICE.name,
    port: settings?.adapterPort?.trim() || DEFAULT_ADAPTER_SERVICE.port,
  };
}

/** The adapter Service to use, following changes made on the settings page. */
export function useAdapterService(): AdapterService {
  const settings = getConfigStore().useConfig()();
  const { namespace, name, port } = adapterServiceFrom(settings);
  // Rebuilt from the three values, so callers only see a new object when one changed.
  return useMemo(() => ({ namespace, name, port }), [namespace, name, port]);
}
