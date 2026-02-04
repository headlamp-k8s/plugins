/*
 * Copyright 2025 The Headlamp Authors
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

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { useEffect, useState } from 'react';
import { getUCPApiVersion } from '../config';

/**
 * Radius CRD API configuration
 * Using 'v1alpha3' as the current stable version, but Headlamp will fallback to discovery if needed
 *
 * Note: Radius deploys the following CRDs:
 * - deploymentresources.radapp.io - Tracks deployed Radius resources
 * - recipes.radapp.io - Manages recipe-based deployments
 * - deploymenttemplates.radapp.io - Manages ARM/Bicep templates
 *
 * If Radius updates to v1beta1 or v1, update the version here or use multiple entries:
 * [{ group: 'radapp.io', version: 'v1' }, { group: 'radapp.io', version: 'v1alpha3' }]
 */
const RADIUS_API_INFO = [{ group: 'radapp.io', version: 'v1alpha3' }];

/**
 * Radius DeploymentResource CRD class
 * DeploymentResources track all Radius resource deployments in Kubernetes
 * This is the primary CRD for querying Radius applications, environments, and other resources
 */
export const DeploymentResourceClass = makeCustomResourceClass({
  apiInfo: RADIUS_API_INFO,
  isNamespaced: true,
  singularName: 'deploymentresource',
  pluralName: 'deploymentresources',
});

/**
 * Radius Recipe CRD class
 * Recipes represent recipe-based resource deployments
 */
export const RecipeClass = makeCustomResourceClass({
  apiInfo: RADIUS_API_INFO,
  isNamespaced: true,
  singularName: 'recipe',
  pluralName: 'recipes',
});

/**
 * Legacy aliases for backward compatibility
 * Note: These may not work if the specific CRDs don't exist in your cluster
 * Consider using DeploymentResourceClass and filtering by resource type instead
 */
export const ApplicationClass = makeCustomResourceClass({
  apiInfo: RADIUS_API_INFO,
  isNamespaced: true,
  singularName: 'application',
  pluralName: 'applications',
});

export const EnvironmentClass = makeCustomResourceClass({
  apiInfo: RADIUS_API_INFO,
  isNamespaced: true,
  singularName: 'environment',
  pluralName: 'environments',
});

export const ContainerClass = makeCustomResourceClass({
  apiInfo: RADIUS_API_INFO,
  isNamespaced: true,
  singularName: 'container',
  pluralName: 'containers',
});

/**
 * Type definitions for Radius CRD resources
 */

export interface RadiusResource {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: any;
  status?: any;
}

/**
 * RadiusDeploymentResource represents a Radius resource deployment
 * This CRD tracks Applications.Core resources like applications, environments, containers
 */
export interface RadiusDeploymentResource extends RadiusResource {
  kind: 'DeploymentResource';
  spec: {
    id: string; // Radius resource ID like "/planes/radius/local/resourceGroups/default/providers/Applications.Core/applications/myapp"
  };
  status?: {
    id?: string;
    phrase?: 'Provisioning' | 'Updating' | 'Ready' | 'Failed' | 'Deleting' | 'Deleted';
    scope?: string;
    resource?: string;
    operation?: {
      resumeToken?: string;
      operationKind?: string;
    };
  };
}

/**
 * RadiusRecipe represents a Recipe deployment
 */
export interface RadiusRecipe extends RadiusResource {
  kind: 'Recipe';
  spec: {
    type: string; // ex: 'Applications.Datastores/redisCaches'
    secretName?: string;
    environment?: string;
    application?: string;
  };
  status?: {
    phrase?: 'Updating' | 'Ready' | 'Failed' | 'Deleting';
    resource?: string;
    scope?: string;
    observedGeneration?: number;
    operation?: {
      resumeToken?: string;
      operationKind?: string;
    };
  };
}

/**
 * Legacy type definitions for backward compatibility
 */
export interface RadiusApplication extends RadiusResource {
  kind: 'Application';
  spec: {
    environment?: string;
  };
  status?: {
    compute?: {
      kind?: string;
      resourceProvisioning?: string;
    };
  };
}

export interface RadiusEnvironment extends RadiusResource {
  kind: 'Environment';
  spec: {
    compute?: {
      kind?: string;
      namespace?: string;
    };
    providers?: {
      azure?: {
        scope?: string;
      };
    };
  };
  status?: {
    compute?: {
      kind?: string;
      resourceProvisioning?: string;
    };
  };
}

/**
 * Helper function to safely get resource status
 */
export function getResourceStatus(resource: RadiusResource): string {
  if ('status' in resource && resource.status) {
    // Check for DeploymentResource status
    if ('phrase' in resource.status) {
      return resource.status.phrase;
    }
    // Check for legacy status format
    if (resource.status.compute?.resourceProvisioning) {
      return resource.status.compute.resourceProvisioning;
    }
  }
  return 'Unknown';
}

/**
 * Helper function to get environment from application
 */
export function getApplicationEnvironment(app: RadiusApplication): string {
  return app.spec?.environment || 'N/A';
}

/**
 * Helper function to parse Radius resource ID from DeploymentResource
 * Extracts resource type and name from IDs like:
 * "/planes/radius/local/resourceGroups/default/providers/Applications.Core/applications/myapp"
 */
export function parseRadiusResourceId(resourceId: string): {
  resourceType: string;
  resourceName: string;
  resourceProvider: string;
} | null {
  if (!resourceId) return null;

  // Match pattern: /providers/{provider}/{type}/{name}
  const regex = /\/providers\/([^/]+)\/([^/]+)\/([^/]+)$/;
  const match = regex.exec(resourceId);
  if (!match) return null;

  return {
    resourceProvider: match[1], // ex "Applications.Core"
    resourceType: match[2], // ex "applications"
    resourceName: match[3], // ex "myapp"
  };
}

/**
 * Helper function to filter DeploymentResources by resource type
 */
export function filterDeploymentResourcesByType(
  resources: RadiusDeploymentResource[],
  resourceType: string // ex "applications", "environments", "containers"
): RadiusDeploymentResource[] {
  return resources.filter(resource => {
    const parsed = parseRadiusResourceId(resource.spec?.id);
    return parsed?.resourceType === resourceType;
  });
}

/**
 * UCP API types and interfaces
 * Radius exposes its API through Kubernetes API Aggregation Layer
 * Base path: /apis/api.ucp.dev/v1alpha3/planes/radius/local/providers/{provider}/{resourceType}
 */

export interface UCPApplication {
  id: string; // ex "/planes/radius/local/resourceGroups/default/providers/Applications.Core/applications/eshop"
  name: string;
  type: string; // "Applications.Core/applications"
  location: string;
  properties: {
    environment: string;
    provisioningState?: string;
    status?: {
      compute?: {
        kind?: string;
        namespace?: string;
      };
    };
  };
  systemData?: {
    createdAt?: string;
    createdBy?: string;
    createdByType?: string;
    lastModifiedAt?: string;
    lastModifiedBy?: string;
    lastModifiedByType?: string;
  };
  tags?: Record<string, string>;
}

export interface UCPEnvironment {
  id: string;
  name: string;
  type: string; // "Applications.Core/environments"
  location: string;
  properties: {
    provisioningState?: string;
    compute?: {
      kind?: string;
      namespace?: string;
      resourceId?: string;
    };
    providers?: {
      azure?: {
        scope?: string;
      };
    };
    recipes?: {
      [resourceType: string]: {
        [recipeName: string]: {
          templateKind: string;
          templatePath: string;
          templateVersion?: string;
          plainHttp?: boolean;
          parameters?: Record<string, any>;
        };
      };
    };
  };
  systemData?: {
    createdAt?: string;
    createdBy?: string;
    createdByType?: string;
    lastModifiedAt?: string;
    lastModifiedBy?: string;
    lastModifiedByType?: string;
  };
  tags?: Record<string, string>;
}

export interface UCPListResponse<T> {
  value: T[];
  nextLink?: string;
}

/**
 * Generic UCP Resource interface
 * All Radius resources share this common structure
 */
export interface UCPResource {
  id: string;
  name: string;
  type: string;
  location: string;
  properties: {
    application?: string;
    environment?: string;
    provisioningState?: string;
    status?: {
      compute?: {
        kind?: string;
        namespace?: string;
      };
    };
    [key: string]: any; // Allow additional resource-specific properties
  };
  systemData?: {
    createdAt?: string;
    createdBy?: string;
    createdByType?: string;
    lastModifiedAt?: string;
    lastModifiedBy?: string;
    lastModifiedByType?: string;
  };
  tags?: Record<string, string>;
}

/**
 * Hook to fetch Radius applications from UCP API
 * Uses Kubernetes API Aggregation to access Radius UCP endpoints
 */
export function useRadiusApplications(): [UCPApplication[] | null, Error | null, boolean] {
  const [applications, setApplications] = useState<UCPApplication[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchApplications() {
      try {
        // Get the configured UCP API version from plugin settings
        const apiVersion = getUCPApiVersion();

        // Construct the UCP API path through Kubernetes API Aggregation
        // Note: UCP uses api-version as a query parameter (not a standard K8s parameter)
        const path = `/apis/api.ucp.dev/v1alpha3/planes/radius/local/providers/Applications.Core/applications?api-version=${apiVersion}`;

        // Use Headlamp's request function which handles cluster context and authentication
        const data: UCPListResponse<UCPApplication> = await ApiProxy.request(
          path,
          {}, // request params
          true, // autoLogoutOnAuthError
          true // useCluster
        );

        if (mounted) {
          setApplications(data.value || []);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setApplications(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchApplications();

    return () => {
      mounted = false;
    };
  }, []);

  return [applications, error, loading];
}

/**
 * Hook to fetch Radius environments from UCP API
 */
export function useRadiusEnvironments(): [UCPEnvironment[] | null, Error | null, boolean] {
  const [environments, setEnvironments] = useState<UCPEnvironment[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchEnvironments() {
      try {
        // Get the configured UCP API version from plugin settings
        const apiVersion = getUCPApiVersion();

        // Construct the UCP API path through Kubernetes API Aggregation
        // Note: UCP uses api-version as a query parameter (not a standard K8s parameter)
        const path = `/apis/api.ucp.dev/v1alpha3/planes/radius/local/providers/Applications.Core/environments?api-version=${apiVersion}`;

        // Use Headlamp's request function which handles cluster context and authentication
        const data: UCPListResponse<UCPEnvironment> = await ApiProxy.request(
          path,
          {}, // request params
          true, // autoLogoutOnAuthError
          true // useCluster
        );

        if (mounted) {
          setEnvironments(data.value || []);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setEnvironments(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchEnvironments();

    return () => {
      mounted = false;
    };
  }, []);

  return [environments, error, loading];
}

/**
 * Hook to fetch all Radius resources from multiple resource types and providers
 * Fetches containers, gateways, and other common resource types from various providers
 */
export function useRadiusResources(): [UCPResource[] | null, Error | null, boolean] {
  const [resources, setResources] = useState<UCPResource[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchResources() {
      try {
        const apiVersion = getUCPApiVersion();

        // Define resource types organized by provider
        // Applications.Core - Core application resources
        const coreResourceTypes = [
          'containers',
          'gateways',
          'httpRoutes',
          'secretStores',
          'volumes',
          'extenders',
        ];

        // Applications.Datastores - Database and cache resources
        const datastoreResourceTypes = ['mongoDatabases', 'redisCaches', 'sqlDatabases'];

        // Applications.Messaging - Messaging resources
        const messagingResourceTypes = ['rabbitMQQueues'];

        // Applications.Dapr - Dapr component resources
        const daprResourceTypes = ['pubSubBrokers', 'secretStores', 'stateStores'];

        // Build promises for all resource types across all providers
        const promises: Promise<UCPResource[]>[] = [];

        // Fetch Applications.Core resources
        coreResourceTypes.forEach(resourceType => {
          promises.push(
            (async () => {
              try {
                const path = `/apis/api.ucp.dev/v1alpha3/planes/radius/local/providers/Applications.Core/${resourceType}?api-version=${apiVersion}`;
                const data: UCPListResponse<UCPResource> = await ApiProxy.request(
                  path,
                  {},
                  true,
                  true
                );
                return data.value || [];
              } catch {
                return [];
              }
            })()
          );
        });

        // Fetch Applications.Datastores resources
        datastoreResourceTypes.forEach(resourceType => {
          promises.push(
            (async () => {
              try {
                const path = `/apis/api.ucp.dev/v1alpha3/planes/radius/local/providers/Applications.Datastores/${resourceType}?api-version=${apiVersion}`;
                const data: UCPListResponse<UCPResource> = await ApiProxy.request(
                  path,
                  {},
                  true,
                  true
                );
                return data.value || [];
              } catch {
                return [];
              }
            })()
          );
        });

        // Fetch Applications.Messaging resources
        messagingResourceTypes.forEach(resourceType => {
          promises.push(
            (async () => {
              try {
                const path = `/apis/api.ucp.dev/v1alpha3/planes/radius/local/providers/Applications.Messaging/${resourceType}?api-version=${apiVersion}`;
                const data: UCPListResponse<UCPResource> = await ApiProxy.request(
                  path,
                  {},
                  true,
                  true
                );
                return data.value || [];
              } catch {
                return [];
              }
            })()
          );
        });

        // Fetch Applications.Dapr resources
        daprResourceTypes.forEach(resourceType => {
          promises.push(
            (async () => {
              try {
                const path = `/apis/api.ucp.dev/v1alpha3/planes/radius/local/providers/Applications.Dapr/${resourceType}?api-version=${apiVersion}`;
                const data: UCPListResponse<UCPResource> = await ApiProxy.request(
                  path,
                  {},
                  true,
                  true
                );
                return data.value || [];
              } catch {
                return [];
              }
            })()
          );
        });

        const results = await Promise.all(promises);
        const allResources = results.flat();

        if (mounted) {
          setResources(allResources);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setResources(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchResources();

    return () => {
      mounted = false;
    };
  }, []);

  return [resources, error, loading];
}

/**
 * Hook to fetch resources for a specific application
 * Filters resources that belong to the specified application
 */
export function useApplicationResources(
  applicationId: string
): [UCPResource[] | null, Error | null, boolean] {
  const [resources, allResourcesError, loading] = useRadiusResources();
  const [filteredResources, setFilteredResources] = useState<UCPResource[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (resources) {
      const appResources = resources.filter(resource => {
        if (!resource.properties.application) {
          return false;
        }

        if (resource.properties.application === applicationId) {
          return true;
        }

        const appIdParts = applicationId.split('/');
        const appName = appIdParts.at(-1);
        const resourceAppParts = resource.properties.application.split('/');
        const resourceAppName = resourceAppParts.at(-1);

        return appName === resourceAppName;
      });

      setFilteredResources(appResources);
      setError(null);
    } else if (allResourcesError) {
      setError(allResourcesError);
      setFilteredResources(null);
    }
  }, [resources, allResourcesError, applicationId]);

  return [filteredResources, error, loading];
}

/**
 * Interface for Radius Resource Type
 */
export interface UCPResourceType {
  id: string;
  name: string;
  type: string;
  apiVersions: {
    [version: string]: any;
  };
  capabilities: string[];
  description?: string;
  resourceProvider?: string;
}

/**
 * Interface for Radius Resource Provider
 */
interface UCPResourceProvider {
  name: string;
  locations?: {
    [location: string]: any;
  };
  resourceTypes: {
    [key: string]: {
      apiVersions: {
        [version: string]: any;
      };
      capabilities: string[];
      description?: string;
    };
  };
}

/**
 * Hook to fetch Radius resource types from UCP API
 * Fetches all providers and extracts resource types from each provider
 */
export function useRadiusResourceTypes(): [UCPResourceType[] | null, Error | null, boolean] {
  const [resourceTypes, setResourceTypes] = useState<UCPResourceType[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchResourceTypes() {
      try {
        // Get the configured UCP API version from plugin settings
        const apiVersion = getUCPApiVersion();

        // Query all providers - each provider includes its resource types
        const path = `/apis/api.ucp.dev/v1alpha3/planes/radius/local/providers?api-version=${apiVersion}`;

        const data: UCPListResponse<UCPResourceProvider> = await ApiProxy.request(
          path,
          {}, // request params
          true, // autoLogoutOnAuthError
          true // useCluster
        );

        // Extract resource types from each provider
        const allResourceTypes: UCPResourceType[] = [];
        
        (data.value || []).forEach(provider => {
          const providerName = provider.name;
          const resourceTypesObj = provider.resourceTypes || {};
          
          // Convert resource types object to array and add provider name
          Object.entries(resourceTypesObj).forEach(([typeName, resourceType]) => {
            allResourceTypes.push({
              id: `/planes/radius/local/providers/${providerName}/resourcetypes/${typeName}`,
              name: typeName,
              type: `${providerName}/${typeName}`,
              apiVersions: resourceType.apiVersions || {},
              capabilities: resourceType.capabilities || [],
              description: resourceType.description,
              resourceProvider: providerName,
            });
          });
        });

        if (mounted) {
          setResourceTypes(allResourceTypes);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setResourceTypes(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchResourceTypes();

    return () => {
      mounted = false;
    };
  }, []);

  return [resourceTypes, error, loading];
}

/**
 * Hook to fetch a specific Radius resource type detail
 * Uses the same providers endpoint as the list to ensure we get complete data including schemas
 * @param provider - The resource provider (e.g., "Applications.Core")
 * @param typeName - The resource type name (e.g., "applications")
 */
export function useRadiusResourceTypeDetail(
  provider: string,
  typeName: string
): [UCPResourceType | null, Error | null, boolean] {
  const [resourceType, setResourceType] = useState<UCPResourceType | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchResourceTypeDetail() {
      try {
        const apiVersion = getUCPApiVersion();

        // Use the same providers endpoint as the list
        const path = `/apis/api.ucp.dev/v1alpha3/planes/radius/local/providers?api-version=${apiVersion}`;

        const data: UCPListResponse<UCPResourceProvider> = await ApiProxy.request(
          path,
          {}, // request params
          true, // autoLogoutOnAuthError
          true // useCluster
        );

        // Find the specific provider and resource type
        const targetProvider = data.value?.find(p => p.name === provider);
        if (!targetProvider) {
          throw new Error(`Provider ${provider} not found`);
        }

        const resourceTypesObj = targetProvider.resourceTypes || {};
        const targetResourceType = resourceTypesObj[typeName];
        
        if (!targetResourceType) {
          throw new Error(`Resource type ${typeName} not found in provider ${provider}`);
        }

        // Construct the full resource type object
        const fullResourceType: UCPResourceType = {
          id: `/planes/radius/local/providers/${provider}/resourcetypes/${typeName}`,
          name: typeName,
          type: `${provider}/${typeName}`,
          apiVersions: targetResourceType.apiVersions || {},
          capabilities: targetResourceType.capabilities || [],
          description: targetResourceType.description,
          resourceProvider: provider,
        };

        if (mounted) {
          setResourceType(fullResourceType);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setResourceType(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (provider && typeName) {
      fetchResourceTypeDetail();
    } else {
      setLoading(false);
      setError(new Error('Provider and type name are required'));
    }

    return () => {
      mounted = false;
    };
  }, [provider, typeName]);

  return [resourceType, error, loading];
}
