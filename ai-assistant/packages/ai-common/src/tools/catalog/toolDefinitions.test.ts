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

import { describe, expect, it } from 'vitest';
import { getAllAvailableTools, isBuiltInTool, isSensitiveBuiltInToolCall } from './toolDefinitions';

describe('toolDefinitions', () => {
  it('returns the built-in tools', () => {
    expect(getAllAvailableTools()).toEqual([
      {
        id: 'kubernetes_api_request',
        name: 'Kubernetes API Request',
        description:
          'Make requests to the Kubernetes API server to fetch, create, update or delete resources.',
        source: 'built-in',
      },
    ]);
  });

  it('identifies tools in the built-in registry', () => {
    expect(isBuiltInTool('kubernetes_api_request')).toBe(true);
    expect(isBuiltInTool('github__search')).toBe(false);
  });

  it('flags Kubernetes Secret access as sensitive, other reads as not', () => {
    expect(
      isSensitiveBuiltInToolCall('kubernetes_api_request', {
        url: '/api/v1/namespaces/default/secrets/db',
        method: 'GET',
      })
    ).toBe(true);
    expect(
      isSensitiveBuiltInToolCall('kubernetes_api_request', {
        url: '/api/v1/secrets',
        method: 'GET',
      })
    ).toBe(true);
    expect(
      isSensitiveBuiltInToolCall('kubernetes_api_request', {
        url: '/api/v1/namespaces/default/pods?labelSelector=x',
        method: 'GET',
      })
    ).toBe(false);
    // Not a built-in tool, or missing/invalid url.
    expect(isSensitiveBuiltInToolCall('github__search', { url: '/secrets' })).toBe(false);
    expect(isSensitiveBuiltInToolCall('kubernetes_api_request', {})).toBe(false);
    expect(isSensitiveBuiltInToolCall('kubernetes_api_request', null)).toBe(false);
  });

  it('normalizes encoded and fragmented Kubernetes Secret URLs', () => {
    expect(isSensitiveBuiltInToolCall('kubernetes_api_request', { url: '/api/v1/%73ecrets' })).toBe(
      true
    );
    expect(
      isSensitiveBuiltInToolCall('kubernetes_api_request', {
        url: '/api/v1/namespaces/default/secrets#item',
      })
    ).toBe(true);
    expect(
      isSensitiveBuiltInToolCall('kubernetes_api_request', {
        url: 'https://cluster.example/api/v1//SeCrEtS/db',
      })
    ).toBe(true);
    expect(isSensitiveBuiltInToolCall('kubernetes_api_request', { url: '/api/v1/%E0%A4%A' })).toBe(
      true
    );
  });
});
