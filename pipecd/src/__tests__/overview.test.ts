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
import type { Deployment, DeploymentStatus } from '../types/pipecd';
import {
  axisTicks,
  bucketDeployments,
  bucketTotal,
  countSync,
  failureRate,
  knownPipeds,
  rangeStart,
  recentDeployments,
} from '../utils/overview';
import {
  appCloudRunDeploying,
  appKubernetesSynced,
  appTerraformOutOfSync,
  deploymentCompleted,
} from './fixtures';

// Built from local dates so the tests pass in any timezone.
const NOW = new Date(2026, 9, 28, 15, 30);

function localUnix(day: number, hour: number): number {
  return Math.floor(new Date(2026, 9, day, hour).getTime() / 1000);
}

function deployment(id: string, createdAt: number, status: DeploymentStatus): Deployment {
  return { ...deploymentCompleted, id, createdAt, updatedAt: createdAt, status };
}

describe('rangeStart', () => {
  it('starts day ranges at local midnight', () => {
    expect(rangeStart('7d', NOW)).toBe(localUnix(22, 0));
    expect(rangeStart('30d', NOW)).toBe(Math.floor(new Date(2026, 9, -1).getTime() / 1000));
  });

  it('starts the 24 hour range at the top of the hour', () => {
    expect(rangeStart('24h', NOW)).toBe(localUnix(27, 16));
  });
});

describe('bucketDeployments', () => {
  // On 8 March 2026 New York clocks jump from 02:00 to 03:00, so 02:00 does
  // not exist and the 24 hours before noon hold only 23 hours.
  it('gives no bar to the hour skipped when clocks go forward', () => {
    // Removing TZ again does not undo the change, so restore the zone by name.
    const saved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    process.env.TZ = 'America/New_York';
    try {
      // Make sure the zone really changed, or this test would prove nothing.
      expect(new Date(2026, 2, 8, 2).getHours()).toBe(3);

      const buckets = bucketDeployments([], '24h', new Date(2026, 2, 8, 12));
      const starts = buckets.map(b => b.start);

      expect(new Set(starts).size).toBe(starts.length);
      expect(buckets).toHaveLength(23);
    } finally {
      process.env.TZ = saved;
    }
  });

  it('makes one bucket per day, oldest first', () => {
    const buckets = bucketDeployments([], '7d', NOW);

    expect(buckets).toHaveLength(7);
    expect(buckets[0].start).toBe(localUnix(22, 0));
    expect(buckets[6].start).toBe(localUnix(28, 0));
  });

  it('makes one bucket per hour for the last 24 hours', () => {
    const buckets = bucketDeployments([], '24h', NOW);

    expect(buckets).toHaveLength(24);
    expect(buckets[23].start).toBe(localUnix(28, 15));
  });

  it('counts each deployment on the day it was created, by outcome', () => {
    const buckets = bucketDeployments(
      [
        deployment('a', localUnix(22, 9), 'DEPLOYMENT_SUCCESS'),
        deployment('b', localUnix(28, 10), 'DEPLOYMENT_SUCCESS'),
        deployment('c', localUnix(28, 11), 'DEPLOYMENT_FAILURE'),
        deployment('d', localUnix(28, 12), 'DEPLOYMENT_RUNNING'),
        deployment('e', localUnix(28, 13), 'DEPLOYMENT_CANCELLED'),
      ],
      '7d',
      NOW
    );

    expect(buckets[0]).toMatchObject({ success: 1, failure: 0, inProgress: 0, cancelled: 0 });
    expect(buckets[6]).toMatchObject({ success: 1, failure: 1, inProgress: 1, cancelled: 1 });
    expect(buckets.slice(1, 6).every(b => bucketTotal(b) === 0)).toBe(true);
  });

  it('ignores deployments outside the range', () => {
    const buckets = bucketDeployments(
      [
        deployment('old', localUnix(21, 23), 'DEPLOYMENT_SUCCESS'),
        deployment('future', localUnix(29, 1), 'DEPLOYMENT_SUCCESS'),
      ],
      '7d',
      NOW
    );

    expect(buckets.every(b => bucketTotal(b) === 0)).toBe(true);
  });
});

describe('axisTicks', () => {
  it('uses evenly spaced whole numbers that reach the maximum', () => {
    expect(axisTicks(3)).toEqual([0, 1, 2, 3]);
    expect(axisTicks(10)).toEqual([0, 5, 10]);
    expect(axisTicks(38)).toEqual([0, 10, 20, 30, 40]);
  });

  it('still draws an axis when there is no data', () => {
    expect(axisTicks(0)).toEqual([0, 1]);
  });
});

describe('failureRate', () => {
  it('divides failures by finished deployments only', () => {
    const rate = failureRate([
      deployment('a', 1, 'DEPLOYMENT_SUCCESS'),
      deployment('b', 2, 'DEPLOYMENT_SUCCESS'),
      deployment('c', 3, 'DEPLOYMENT_SUCCESS'),
      deployment('d', 4, 'DEPLOYMENT_FAILURE'),
      deployment('e', 5, 'DEPLOYMENT_RUNNING'),
      deployment('f', 6, 'DEPLOYMENT_CANCELLED'),
    ]);

    expect(rate).toEqual({ failed: 1, finished: 4, rate: 0.25 });
  });

  it('is zero when nothing has finished', () => {
    expect(failureRate([deployment('a', 1, 'DEPLOYMENT_RUNNING')]).rate).toBe(0);
  });
});

describe('countSync', () => {
  it('counts synced and out-of-sync applications', () => {
    expect(countSync([appKubernetesSynced, appTerraformOutOfSync, appCloudRunDeploying])).toEqual({
      synced: 1,
      outOfSync: 1,
    });
  });
});

describe('knownPipeds', () => {
  it('counts applications on each piped', () => {
    const counts = knownPipeds(
      [appKubernetesSynced, { ...appKubernetesSynced, id: 'app-k8s-002' }, appTerraformOutOfSync],
      []
    );

    expect(counts.get('piped-prod-001')).toBe(2);
    expect(counts.get('piped-staging-001')).toBe(1);
  });

  it('also finds pipeds that only appear in deployments', () => {
    const counts = knownPipeds(
      [appKubernetesSynced],
      [{ ...deploymentCompleted, pipedId: 'piped-orphan' }]
    );

    expect(counts.get('piped-orphan')).toBe(0);
    expect(counts.get('piped-prod-001')).toBe(1);
  });
});

describe('recentDeployments', () => {
  it('returns the newest first, up to the limit', () => {
    const recent = recentDeployments(
      [
        deployment('a', 10, 'DEPLOYMENT_SUCCESS'),
        deployment('b', 30, 'DEPLOYMENT_SUCCESS'),
        deployment('c', 20, 'DEPLOYMENT_SUCCESS'),
      ],
      2
    );

    expect(recent.map(d => d.id)).toEqual(['b', 'c']);
  });
});
