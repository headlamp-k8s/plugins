/*
 * Copyright 2026 The KubeAtlas Authors
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

import { describe, expect, it } from 'vitest';
import { resourcePath, serviceProxyPath } from './client';

describe('serviceProxyPath', () => {
  const svc = { namespace: 'kubeatlas', name: 'kubeatlas', port: 8080 };

  it('builds a Kubernetes service-proxy path', () => {
    expect(serviceProxyPath(svc, 'api/v1/graph')).toBe(
      '/api/v1/namespaces/kubeatlas/services/kubeatlas:8080/proxy/api/v1/graph'
    );
  });

  it('tolerates a leading slash on the endpoint', () => {
    expect(serviceProxyPath(svc, '/api/v1/graph')).toBe(
      '/api/v1/namespaces/kubeatlas/services/kubeatlas:8080/proxy/api/v1/graph'
    );
  });

  it('url-encodes the namespace and service name', () => {
    const odd = { namespace: 'team a', name: 'svc/x', port: 80 };
    expect(serviceProxyPath(odd, 'api/v1/graph')).toBe(
      '/api/v1/namespaces/team%20a/services/svc%2Fx:80/proxy/api/v1/graph'
    );
  });
});

describe('resourcePath', () => {
  it('builds the resource-detail endpoint path', () => {
    expect(resourcePath('petclinic', 'Deployment', 'api')).toBe(
      'api/v1/resources/petclinic/Deployment/api'
    );
  });

  it('uses the "_" sentinel for a cluster-scoped resource', () => {
    expect(resourcePath('', 'Node', 'worker-1')).toBe('api/v1/resources/_/Node/worker-1');
  });
});
