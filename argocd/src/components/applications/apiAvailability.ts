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

import { Utils } from '@kinvolk/headlamp-plugin/lib';
import { useEffect, useMemo, useState } from 'react';
import {
  ApiCatalog,
  ApiDescriptor,
  apiResourceKey,
  discoverApiCatalog,
} from '../../api/apiDiscovery';
import type { ArgoApplication, ManagedResource } from '../../resources/application';

export type ApiAvailabilityState =
  | 'available'
  | 'version-not-served'
  | 'resource-not-found'
  | 'unknown'
  | 'remote';

export interface ApiAvailability {
  state: ApiAvailabilityState;
  servedVersions: string[];
}

export interface ApiAvailabilityPresentation {
  label: string;
  status: 'success' | 'warning' | 'error' | 'info' | '';
  tooltip: string;
}

export type ApiAvailabilityMap = Map<string, ApiAvailability>;

function availabilityForState(
  resources: ManagedResource[],
  state: 'remote' | 'unknown'
): ApiAvailabilityMap {
  return new Map(
    resources.map(resource => [
      managedResourceApiKey(resource),
      { state, servedVersions: [] } as ApiAvailability,
    ])
  );
}

export function isLocalApplicationDestination(application: ArgoApplication): boolean {
  const destination = application.spec.destination;
  return (
    destination?.server === 'https://kubernetes.default.svc' || destination?.name === 'in-cluster'
  );
}

/** Native resource links are safe only for an explicitly local destination. */
export function canOpenManagedResourcesInCurrentCluster(application: ArgoApplication): boolean {
  return isLocalApplicationDestination(application);
}

export function managedResourceDescriptor(resource: ManagedResource): ApiDescriptor {
  return {
    group: resource.group ?? '',
    version: resource.version ?? '',
    kind: resource.kind,
  };
}

export function managedResourceApiKey(resource: ManagedResource): string {
  const descriptor = managedResourceDescriptor(resource);
  return `${descriptor.group}/${descriptor.version}/${descriptor.kind}`;
}

export function evaluateApiAvailability(
  resource: ManagedResource,
  catalog: ApiCatalog
): ApiAvailability {
  const descriptor = managedResourceDescriptor(resource);
  const discovered = catalog.resources.get(apiResourceKey(descriptor.group, descriptor.kind));

  if (discovered?.versions.has(descriptor.version)) {
    return { state: 'available', servedVersions: [...discovered.versions].sort() };
  }

  if (discovered && catalog.completeGroups.has(descriptor.group)) {
    return { state: 'version-not-served', servedVersions: [...discovered.versions].sort() };
  }

  const groupWasCompletelyRead = catalog.completeGroups.has(descriptor.group);
  const groupIsKnown = catalog.knownGroups.has(descriptor.group);
  const rootWasCompletelyRead = descriptor.group
    ? catalog.groupedRootComplete
    : catalog.coreRootComplete;

  if (groupWasCompletelyRead || (rootWasCompletelyRead && !groupIsKnown)) {
    return { state: 'resource-not-found', servedVersions: [] };
  }

  return { state: 'unknown', servedVersions: [] };
}

export function getApiAvailabilityPresentation(
  result: ApiAvailability | undefined,
  loading: boolean
): ApiAvailabilityPresentation {
  if (loading && !result) {
    return {
      label: 'Checking…',
      status: 'info',
      tooltip: 'Reading the selected cluster API list.',
    };
  }

  switch (result?.state) {
    case 'available':
      return {
        label: 'Available',
        status: 'success',
        tooltip: `Served versions: ${result.servedVersions.join(', ')}`,
      };
    case 'version-not-served':
      return {
        label: 'Version not served',
        status: 'warning',
        tooltip: `Other served versions: ${result.servedVersions.join(', ')}`,
      };
    case 'resource-not-found':
      return {
        label: 'API not found',
        status: 'error',
        tooltip: 'This resource kind was not found in the selected cluster API list.',
      };
    case 'remote':
      return {
        label: 'Not checked — remote',
        status: '',
        tooltip: 'The Application targets a remote or unverified cluster.',
      };
    default:
      return {
        label: 'Unknown',
        status: '',
        tooltip: 'The cluster API list could not be read completely.',
      };
  }
}

export async function loadManagedResourceApiAvailability(
  application: ArgoApplication,
  cluster: string,
  discover = discoverApiCatalog
): Promise<ApiAvailabilityMap> {
  const resources = application.managedResources;
  if (!isLocalApplicationDestination(application)) {
    return availabilityForState(resources, 'remote');
  }

  const catalog = await discover(cluster, resources.map(managedResourceDescriptor));
  return new Map(
    resources.map(resource => [
      managedResourceApiKey(resource),
      evaluateApiAvailability(resource, catalog),
    ])
  );
}

export function useManagedResourceApiAvailability(
  application: ArgoApplication,
  discover = discoverApiCatalog
) {
  const resourcesKey = JSON.stringify(application.managedResources.map(managedResourceDescriptor));
  const cluster = Utils.getCluster() ?? '';
  const remote = !isLocalApplicationDestination(application);
  const [availability, setAvailability] = useState<ApiAvailabilityMap>(() =>
    remote ? availabilityForState(application.managedResources, 'remote') : new Map()
  );
  const [loading, setLoading] = useState(!remote);

  useEffect(() => {
    let active = true;

    if (remote) {
      setAvailability(availabilityForState(application.managedResources, 'remote'));
      setLoading(false);
      return () => {
        active = false;
      };
    }

    if (!cluster) {
      setAvailability(availabilityForState(application.managedResources, 'unknown'));
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setAvailability(new Map());
    setLoading(true);

    loadManagedResourceApiAvailability(application, cluster, discover)
      .then(result => {
        if (active) setAvailability(result);
      })
      .catch(() => {
        if (!active) return;
        setAvailability(availabilityForState(application.managedResources, 'unknown'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [application, cluster, discover, remote, resourcesKey]);

  return useMemo(() => ({ availability, loading }), [availability, loading]);
}
