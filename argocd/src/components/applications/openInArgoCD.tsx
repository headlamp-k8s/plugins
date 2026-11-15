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

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { ArgoApplication } from '../../resources/application';

const { ConfigMap } = K8s.ResourceClasses;

type ApplicationLocation = Pick<ArgoApplication, 'cluster' | 'controllerNamespace' | 'metadata'>;

/**
 * Selects the one namespace where the plugin may read Argo CD configuration.
 *
 * Argo CD's reported controller namespace takes priority. The Application
 * namespace is a compatibility fallback for standard single-namespace
 * installations. The plugin intentionally never searches other namespaces.
 */
export function getArgoConfigNamespace(application: ApplicationLocation): string | undefined {
  return application.controllerNamespace?.trim() || application.metadata.namespace?.trim();
}

/**
 * Builds a safe link to an Application in the native Argo CD UI.
 *
 * @returns An absolute HTTP(S) URL, or `null` when the configured value is unsafe or incomplete.
 */
export function buildArgoApplicationUrl(
  configuredUrl: string | undefined,
  applicationNamespace: string | undefined,
  applicationName: string | undefined
): string | null {
  if (!configuredUrl?.trim() || !applicationNamespace || !applicationName) {
    return null;
  }

  try {
    const url = new URL(configuredUrl.trim());
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }

    const basePath = url.pathname.replace(/\/+$/, '');
    url.pathname = `${basePath}/applications/${encodeURIComponent(
      applicationNamespace
    )}/${encodeURIComponent(applicationName)}`;
    url.search = '';
    url.hash = '';

    return url.toString();
  } catch {
    return null;
  }
}

/** Renders the external Argo CD header action after its ConfigMap is resolved. */
function ConfiguredOpenInArgoCDAction(props: {
  application: ApplicationLocation;
  configNamespace: string;
}) {
  const { application, configNamespace } = props;
  const response = ConfigMap.useGet('argocd-cm', configNamespace, {
    cluster: application.cluster || undefined,
  });
  const [configMap, error] = response;
  const applicationUrl = buildArgoApplicationUrl(
    configMap?.data?.url,
    application.metadata.namespace,
    application.metadata.name
  );

  if (response.isLoading || error || !applicationUrl) {
    return null;
  }

  return (
    <ActionButton
      description="Open in Argo CD"
      longDescription="Open this Application in the configured Argo CD UI in a new tab."
      icon="simple-icons:argo"
      onClick={() => window.open(applicationUrl, '_blank', 'noopener,noreferrer')}
    />
  );
}

/**
 * Shows a safe link to the native Argo CD UI when `argocd-cm.data.url` is available.
 */
export function OpenInArgoCDAction(props: { application: ApplicationLocation }) {
  const configNamespace = getArgoConfigNamespace(props.application);
  if (!configNamespace) {
    return null;
  }

  return (
    <ConfiguredOpenInArgoCDAction
      application={props.application}
      configNamespace={configNamespace}
    />
  );
}
