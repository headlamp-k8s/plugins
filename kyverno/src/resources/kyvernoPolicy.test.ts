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

import { describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => {
  class KubeObject {
    jsonData: any;
    constructor(jsonData: any) {
      this.jsonData = jsonData;
    }
    static getBaseObject() {
      return {};
    }
  }
  return { KubeObject };
});

import { KyvernoClusterPolicy, KyvernoPolicy } from './kyvernoPolicy';
import {
  DeletingPolicy,
  GeneratingPolicy,
  ImageValidatingPolicy,
  MutatingPolicy,
  ValidatingPolicy,
} from './celPolicies';

describe('Kyverno Policy Resources - Spec Safety', () => {
  describe('KyvernoPolicy & KyvernoClusterPolicy', () => {
    it('should safely handle missing spec in KyvernoPolicy', () => {
      const policy = new KyvernoPolicy({
        kind: 'Policy',
        apiVersion: 'kyverno.io/v1',
        metadata: {
          name: 'disallow-latest-tag',
          namespace: 'default',
          uid: 'policy-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

      expect(policy.rules).toEqual([]);
      expect(policy.ruleTypes).toEqual([]);
      expect(policy.validationFailureAction).toBe('Audit');
      expect(policy.background).toBe(true);
    });

    it('should safely handle missing spec in KyvernoClusterPolicy', () => {
      const clusterPolicy = new KyvernoClusterPolicy({
        kind: 'ClusterPolicy',
        apiVersion: 'kyverno.io/v1',
        metadata: {
          name: 'require-labels',
          uid: 'clusterpolicy-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

      expect(clusterPolicy.rules).toEqual([]);
      expect(clusterPolicy.ruleTypes).toEqual([]);
      expect(clusterPolicy.validationFailureAction).toBe('Audit');
      expect(clusterPolicy.background).toBe(true);
    });

    it('should evaluate rules and properties correctly when spec is defined', () => {
      const policy = new KyvernoPolicy({
        kind: 'Policy',
        apiVersion: 'kyverno.io/v1',
        metadata: {
          name: 'check-labels',
          namespace: 'prod',
          uid: 'policy-2',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        spec: {
          validationFailureAction: 'Enforce',
          background: false,
          rules: [
            {
              name: 'check-team-label',
              validate: { message: 'Label required' },
            },
          ],
        },
      });

      expect(policy.rules).toHaveLength(1);
      expect(policy.ruleTypes).toEqual(['Validate']);
      expect(policy.validationFailureAction).toBe('Enforce');
      expect(policy.background).toBe(false);
    });
  });

  describe('CEL Policy Resources', () => {
    it('should safely handle missing spec in ValidatingPolicy', () => {
      const vp = new ValidatingPolicy({
        kind: 'ValidatingPolicy',
        apiVersion: 'policies.kyverno.io/v1',
        metadata: {
          name: 'cel-validating',
          uid: 'vp-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

      expect(vp.validationActions).toEqual(['Audit']);
      expect(vp.validationCount).toBe(0);
      expect(vp.isAdmissionEnabled).toBe(true);
      expect(vp.isBackgroundEnabled).toBe(true);
    });

    it('should safely handle missing spec in MutatingPolicy', () => {
      const mp = new MutatingPolicy({
        kind: 'MutatingPolicy',
        apiVersion: 'policies.kyverno.io/v1',
        metadata: {
          name: 'cel-mutating',
          uid: 'mp-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

      expect(mp.mutationCount).toBe(0);
      expect(mp.isAdmissionEnabled).toBe(true);
      expect(mp.isBackgroundEnabled).toBe(true);
    });

    it('should safely handle missing spec in GeneratingPolicy', () => {
      const gp = new GeneratingPolicy({
        kind: 'GeneratingPolicy',
        apiVersion: 'policies.kyverno.io/v1',
        metadata: {
          name: 'cel-generating',
          uid: 'gp-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

      expect(gp.generateCount).toBe(0);
    });

    it('should safely handle missing spec in DeletingPolicy', () => {
      const dp = new DeletingPolicy({
        kind: 'DeletingPolicy',
        apiVersion: 'policies.kyverno.io/v1',
        metadata: {
          name: 'cel-deleting',
          uid: 'dp-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

      expect(dp.schedule).toBe('-');
    });

    it('should safely handle missing spec in ImageValidatingPolicy', () => {
      const ivp = new ImageValidatingPolicy({
        kind: 'ImageValidatingPolicy',
        apiVersion: 'policies.kyverno.io/v1',
        metadata: {
          name: 'cel-image-validating',
          uid: 'ivp-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

      expect(ivp.imagePatterns).toEqual([]);
      expect(ivp.attestorCount).toBe(0);
    });
  });
});
