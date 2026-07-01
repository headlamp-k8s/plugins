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

/**
 * Browser-only module for resolving Headlamp resource links.
 *
 * This depends on `@kinvolk/headlamp-plugin` and `window`, so it MUST NOT
 * be imported from Node.js-safe sub-paths (root, /utils, /config, etc.).
 * It is exported from `@headlamp-k8s/ai-common/ai` which is already browser-only.
 */

import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/lib/k8s';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';

const HEADLAMP_LINK_HOST = 'headlamp';
const HEADLAMP_RESOURCE_DETAILS_LINK = 'resource-details';
const HEADLAMP_CLUSTER_LINK = 'cluster';

export function getHeadlampLink(link: string | null | undefined) {
  const linkResult: {
    isHeadlampLink: boolean;
    url: string;
    kubeObject: KubeObject | null;
  } = {
    isHeadlampLink: false,
    url: '',
    kubeObject: null,
  };

  // Early return if link is falsy
  if (!link || typeof link !== 'string') {
    return linkResult;
  }

  let url: URL;
  try {
    url = new URL(link, window.location.origin);
  } catch (error) {
    console.warn('Invalid URL provided to getHeadlampLink:', link, error);
    return linkResult;
  }

  // Check if it's a resource details link
  if (url.host === HEADLAMP_LINK_HOST) {
    linkResult.isHeadlampLink = true;
    // Check if the path is for resource details
    const urlPath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    if (urlPath === HEADLAMP_RESOURCE_DETAILS_LINK) {
      const searchParams = new URLSearchParams(url.search);
      const cluster = searchParams.get('cluster');
      const kind = searchParams.get('kind');
      const resource = searchParams.get('resource');
      const namespace = searchParams.get('ns');

      // @todo: Add support for CRDs
      // Guard against ResourceClasses being undefined at runtime
      let resourceClass = ResourceClasses?.[kind];
      // If we couldn't match it like this, iterate and try to match it from the API name
      if (!resourceClass && ResourceClasses) {
        for (const className in ResourceClasses) {
          const rc = ResourceClasses[className];
          if (rc.apiName === kind) {
            resourceClass = rc;
            break;
          }
        }
      }

      if (
        resourceClass &&
        resource &&
        cluster &&
        (resourceClass.isNamespaced ? !!namespace : true)
      ) {
        // Create an instance
        const instance = new resourceClass(
          {
            kind,
            metadata: {
              name: resource,
              ...(resourceClass.isNamespaced ? { namespace } : {}),
            },
          },
          cluster
        );

        linkResult.kubeObject = instance;
        linkResult.url = instance.getDetailsLink();
      }
    } else if (urlPath === HEADLAMP_CLUSTER_LINK) {
      // It's a cluster link
      const searchParams = new URLSearchParams(url.search);
      const cluster = searchParams.get('cluster');
      if (!!cluster) {
        linkResult.url = `/c/${cluster}`;
      }
    }
  }

  // If not a valid Headlamp link, return null
  return linkResult;
}
