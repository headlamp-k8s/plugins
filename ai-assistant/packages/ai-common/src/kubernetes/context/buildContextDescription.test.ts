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

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  generateContextDescription,
  generateResourceSummary,
  minimizeResourceList,
} from './buildContextDescription';

describe('contextGenerator', () => {
  describe('minimizeResourceList', () => {
    it('returns an empty array for an empty array', () => {
      expect(minimizeResourceList([])).toEqual([]);
    });

    it('returns an empty array for non-array input', () => {
      expect(minimizeResourceList(null)).toEqual([]);
      expect(minimizeResourceList({})).toEqual([]);
    });

    it('minimizes an array of standard resources', () => {
      const resources = [
        {
          kind: 'Pod',
          metadata: { name: 'api', namespace: 'prod', extra: 'ignored' },
          status: { phase: 'Running' },
          spec: { containers: [{ name: 'app' }] },
          _clusterName: 'cluster-a',
        },
      ];

      expect(minimizeResourceList(resources)).toEqual([
        {
          kind: 'Pod',
          metadata: { name: 'api', namespace: 'prod' },
          status: { phase: 'Running' },
          _clusterName: 'cluster-a',
        },
      ]);
    });

    it('minimizes resources using jsonData fallbacks', () => {
      const resources = [
        {
          jsonData: {
            kind: 'Deployment',
            metadata: { name: 'web', namespace: 'apps' },
            status: { replicas: 3, readyReplicas: 2 },
          },
          _clusterName: 'cluster-b',
        },
      ];

      expect(minimizeResourceList(resources)).toEqual([
        {
          kind: 'Deployment',
          metadata: { name: 'web', namespace: 'apps' },
          status: { replicas: 3, readyReplicas: 2 },
          _clusterName: 'cluster-b',
        },
      ]);
    });
  });

  describe('generateContextDescription', () => {
    it('returns an empty string for a null event', () => {
      expect(generateContextDescription(null)).toBe('');
    });

    it('describes a single cluster and a titled view', () => {
      const result = generateContextDescription({ title: 'Pods' }, 'cluster-a');

      expect(result).toContain('You are viewing cluster: cluster-a');
      expect(result).toContain('Current view: Pods');
    });

    it('describes multiple selected clusters', () => {
      const result = generateContextDescription({ type: 'Overview' }, undefined, undefined, [
        'cluster-a',
        'cluster-b',
      ]);

      expect(result).toContain('You are viewing selected clusters: cluster-a, cluster-b');
      expect(result).toContain('Current view: Overview');
    });

    it('describes a pod resource with status and container readiness', () => {
      const result = generateContextDescription(
        {
          resource: {
            kind: 'Pod',
            metadata: { name: 'api-123', namespace: 'prod' },
            status: {
              phase: 'Running',
              containerStatuses: [{ ready: true }, { ready: false }],
            },
            spec: { containers: [{ name: 'app' }, { name: 'sidecar' }] },
          },
        },
        'cluster-a'
      );

      expect(result).toContain('Viewing Pod: api-123 in namespace prod');
      expect(result).toContain('Resource status: Running');
      expect(result).toContain('Pod has 2 container(s)');
      expect(result).toContain('1/2 containers ready');
    });

    it('summarizes unhealthy pods from an items list', () => {
      const result = generateContextDescription({
        items: [
          { kind: 'Pod', metadata: { name: 'healthy' }, status: { phase: 'Running' } },
          { kind: 'Pod', metadata: { name: 'complete' }, status: { phase: 'Succeeded' } },
          { kind: 'Pod', metadata: { name: 'pending' }, status: { phase: 'Pending' } },
          { kind: 'Pod', metadata: { name: 'failed' }, status: { phase: 'Failed' } },
        ],
      });

      expect(result).toContain('Showing 4 pods');
      expect(result).toContain('⚠️ 2 pod(s) may need attention');
    });

    it('summarizes unhealthy deployments from a resources list', () => {
      const result = generateContextDescription(
        {
          resources: [
            {
              jsonData: {
                kind: 'Deployment',
                metadata: { name: 'api', namespace: 'prod' },
                status: { replicas: 3, readyReplicas: 2 },
              },
              _clusterName: 'west',
            },
            {
              kind: 'Deployment',
              metadata: { name: 'worker' },
              status: { replicas: 1, readyReplicas: 1 },
              _clusterName: 'east',
            },
          ],
          resourceKind: 'Deployment',
        },
        'home'
      );

      expect(result).toContain('Showing 2 deployments');
      expect(result).toContain('⚠️ 1 deployment(s) may need attention');
    });

    it('includes cluster warnings and warning resources in structured context', () => {
      const result = generateContextDescription({ type: 'Events' }, 'cluster-a', {
        'cluster-a': {
          warnings: [
            {
              message: 'ImagePullBackOff',
              involvedObject: { kind: 'Pod', name: 'api-123', namespace: 'prod' },
            },
          ],
          error: null,
        },
      });

      expect(result).toContain('Cluster status and warnings:');
      expect(result).toContain('⚠️ cluster-a warnings:');
      expect(result).toContain('- ImagePullBackOff');
      expect(result).toContain(
        'RESOURCES IN CONTEXT (use the resource name as the markdown link text):'
      );
      expect(result).toContain('- kind: Pod, name: api-123, namespace: prod, cluster: cluster-a');
    });

    it('includes cluster errors and healthy clusters', () => {
      const result = generateContextDescription(
        { type: 'Overview' },
        undefined,
        {
          'cluster-b': { warnings: [], error: new Error('API unavailable') },
          'cluster-c': { warnings: [], error: null },
        },
        ['cluster-b', 'cluster-c']
      );

      expect(result).toContain('Status and warnings for 2 selected clusters:');
      expect(result).toContain('❗cluster-b errors: API unavailable');
      expect(result).toContain('cluster-c is healthy!');
    });

    it('includes structured resources from resource, items, and resources', () => {
      const result = generateContextDescription(
        {
          resource: { kind: 'Pod', metadata: { name: 'api', namespace: 'prod' } },
          items: [{ kind: 'Service', metadata: { name: 'frontend' } }],
          resources: [
            {
              jsonData: {
                kind: 'Deployment',
                metadata: { name: 'web' },
                status: { replicas: 1, readyReplicas: 1 },
              },
              _clusterName: 'remote',
            },
          ],
          resourceKind: 'Deployment',
        },
        'primary'
      );

      expect(result).toContain(
        'RESOURCES IN CONTEXT (use the resource name as the markdown link text):'
      );
      expect(result).toContain('- kind: Pod, name: api, namespace: prod, cluster: primary');
      expect(result).toContain(
        '- kind: Service, name: frontend, namespace: default, cluster: primary'
      );
      expect(result).toContain(
        '- kind: Deployment, name: web, namespace: default, cluster: remote'
      );
    });
  });

  describe('generateResourceSummary', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns an empty string for a null resource', () => {
      expect(generateResourceSummary(null)).toBe('');
    });

    it('summarizes a pod with its status', () => {
      const result = generateResourceSummary({
        kind: 'Pod',
        metadata: { name: 'api', namespace: 'prod' },
        status: { phase: 'Running' },
      });

      expect(result).toBe('Pod: api, Namespace: prod, Status: Running');
    });

    it('summarizes a deployment with ready and desired replicas', () => {
      const result = generateResourceSummary({
        kind: 'Deployment',
        metadata: { name: 'web', namespace: 'apps' },
        status: { replicas: 3, readyReplicas: 2 },
      });

      expect(result).toBe('Deployment: web, Namespace: apps, Replicas: 2/3');
    });

    it('summarizes a service with its type', () => {
      const result = generateResourceSummary({
        kind: 'Service',
        metadata: { name: 'frontend', namespace: 'prod' },
        spec: { type: 'LoadBalancer' },
      });

      expect(result).toBe('Service: frontend, Namespace: prod, Type: LoadBalancer');
    });

    it('includes age for resources with a creation timestamp', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-03T12:00:00.000Z'));

      const result = generateResourceSummary({
        kind: 'ConfigMap',
        metadata: {
          name: 'settings',
          namespace: 'prod',
          creationTimestamp: '2025-01-01T12:00:00.000Z',
        },
      });

      expect(result).toBe('ConfigMap: settings, Namespace: prod, Age: 2d');
    });
  });
});
