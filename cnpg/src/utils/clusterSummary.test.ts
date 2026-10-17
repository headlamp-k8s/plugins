/*
 * Copyright 2026 The Kubernetes Authors
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

import {
  formatInstancesReady,
  getClusterPhase,
  getCurrentPrimary,
  getInstancesReady,
} from './clusterSummary';

describe('getClusterPhase', () => {
  it('returns the reported phase', () => {
    expect(getClusterPhase({ status: { phase: 'Cluster in healthy state' } })).toBe(
      'Cluster in healthy state'
    );
  });

  it('returns null when the phase is absent', () => {
    expect(getClusterPhase({ status: {} })).toBeNull();
  });

  it('returns null for a cluster with no status at all', () => {
    expect(getClusterPhase({})).toBeNull();
  });

  it('does not throw on undefined input', () => {
    expect(getClusterPhase(undefined)).toBeNull();
  });
});

describe('getInstancesReady', () => {
  it('reports ready and desired counts from status', () => {
    expect(getInstancesReady({ status: { readyInstances: 2, instances: 3 } })).toEqual({
      ready: 2,
      desired: 3,
    });
  });

  it('falls back to spec.instances when status.instances is absent', () => {
    expect(getInstancesReady({ spec: { instances: 3 }, status: { readyInstances: 1 } })).toEqual({
      ready: 1,
      desired: 3,
    });
  });

  it('reports zero ready instances rather than treating zero as missing', () => {
    expect(getInstancesReady({ status: { readyInstances: 0, instances: 3 } })).toEqual({
      ready: 0,
      desired: 3,
    });
  });

  it('returns nulls when neither count is available', () => {
    expect(getInstancesReady({ status: {} })).toEqual({ ready: null, desired: null });
  });

  it('does not throw on undefined input', () => {
    expect(getInstancesReady(undefined)).toEqual({ ready: null, desired: null });
  });
});

describe('formatInstancesReady', () => {
  it('renders a ready/desired ratio', () => {
    expect(formatInstancesReady({ ready: 2, desired: 3 })).toBe('2/3');
  });

  it('renders an unknown ready count as a question mark', () => {
    expect(formatInstancesReady({ ready: null, desired: 3 })).toBe('?/3');
  });

  it('renders an em dash when nothing is known', () => {
    expect(formatInstancesReady({ ready: null, desired: null })).toBe('—');
  });
});

describe('getCurrentPrimary', () => {
  it('returns the current primary instance name', () => {
    expect(getCurrentPrimary({ status: { currentPrimary: 'pg-1' } })).toBe('pg-1');
  });

  it('returns null when no primary has been elected yet', () => {
    expect(getCurrentPrimary({ status: {} })).toBeNull();
  });

  it('treats an empty string as no primary', () => {
    expect(getCurrentPrimary({ status: { currentPrimary: '' } })).toBeNull();
  });
});
