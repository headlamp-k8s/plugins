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

import { CnpgClusterLike } from '../resources/types';
import { getInstanceTopology, isSwitchoverInProgress } from './topology';

/** A three-instance cluster in the shape CNPG 1.29/1.30 actually reports. */
const healthy: CnpgClusterLike = {
  status: {
    currentPrimary: 'pg-1',
    targetPrimary: 'pg-1',
    instanceNames: ['pg-1', 'pg-2', 'pg-3'],
    instancesStatus: { healthy: ['pg-1', 'pg-2', 'pg-3'] },
    instancesReportedState: {
      'pg-1': { isPrimary: true, timeLineID: 4, ip: '10.0.0.1' },
      'pg-2': { isPrimary: false, timeLineID: 4, ip: '10.0.0.2' },
      'pg-3': { isPrimary: false, timeLineID: 4, ip: '10.0.0.3' },
    },
  },
};

describe('getInstanceTopology', () => {
  it('reports role, health, and timeline for every instance', () => {
    expect(getInstanceTopology(healthy)).toEqual([
      {
        name: 'pg-1',
        role: 'primary',
        health: 'healthy',
        healthLabel: 'healthy',
        timelineId: 4,
        ip: '10.0.0.1',
      },
      {
        name: 'pg-2',
        role: 'replica',
        health: 'healthy',
        healthLabel: 'healthy',
        timelineId: 4,
        ip: '10.0.0.2',
      },
      {
        name: 'pg-3',
        role: 'replica',
        health: 'healthy',
        healthLabel: 'healthy',
        timelineId: 4,
        ip: '10.0.0.3',
      },
    ]);
  });

  it('lists the primary first regardless of the order the operator reports', () => {
    const shuffled: CnpgClusterLike = {
      status: { ...healthy.status, instanceNames: ['pg-3', 'pg-2', 'pg-1'] },
    };

    expect(getInstanceTopology(shuffled).map(entry => entry.name)).toEqual([
      'pg-1',
      'pg-2',
      'pg-3',
    ]);
  });

  it('marks an instance the operator lists as failed', () => {
    const degraded: CnpgClusterLike = {
      status: {
        ...healthy.status,
        instancesStatus: { healthy: ['pg-1', 'pg-2'], failed: ['pg-3'] },
      },
    };

    const byName = Object.fromEntries(getInstanceTopology(degraded).map(e => [e.name, e]));
    expect(byName['pg-3'].health).toBe('failed');
    expect(byName['pg-1'].health).toBe('healthy');
  });

  it('reports a replicating instance as its own state, not as failed', () => {
    const catchingUp: CnpgClusterLike = {
      status: {
        ...healthy.status,
        instancesStatus: { healthy: ['pg-1'], replicating: ['pg-2', 'pg-3'] },
      },
    };

    expect(getInstanceTopology(catchingUp).map(e => e.health)).toEqual([
      'healthy',
      'replicating',
      'replicating',
    ]);
  });

  it('preserves an unrecognised health bucket as a label while reporting unknown health', () => {
    const future: CnpgClusterLike = {
      status: { ...healthy.status, instancesStatus: { somethingNew: ['pg-1', 'pg-2', 'pg-3'] } },
    };

    const [first] = getInstanceTopology(future);
    expect(first.health).toBe('unknown');
    expect(first.healthLabel).toBe('somethingNew');
  });

  it('degrades to unknown role and health for a cluster that has not elected a primary', () => {
    // This is the real shape of a cluster stuck bootstrapping: names are known,
    // but instancesStatus, instancesReportedState and currentPrimary are all absent.
    const bootstrapping: CnpgClusterLike = {
      status: { targetPrimary: 'pg-1', instanceNames: ['pg-1'] },
    };

    expect(getInstanceTopology(bootstrapping)).toEqual([
      {
        name: 'pg-1',
        role: 'unknown',
        health: 'unknown',
        healthLabel: null,
        timelineId: null,
        ip: null,
      },
    ]);
  });

  it('falls back to the names the operator reports state for when instanceNames is missing', () => {
    const noNames: CnpgClusterLike = {
      status: {
        currentPrimary: 'pg-1',
        instancesStatus: { healthy: ['pg-2'] },
        instancesReportedState: { 'pg-1': { isPrimary: true } },
      },
    };

    expect(getInstanceTopology(noNames).map(e => e.name)).toEqual(['pg-1', 'pg-2']);
  });

  it('trusts the reported primary flag when currentPrimary is not set', () => {
    const noCurrentPrimary: CnpgClusterLike = {
      status: {
        instanceNames: ['pg-1', 'pg-2'],
        instancesReportedState: { 'pg-1': { isPrimary: false }, 'pg-2': { isPrimary: true } },
      },
    };

    expect(getInstanceTopology(noCurrentPrimary).map(e => [e.name, e.role])).toEqual([
      ['pg-2', 'primary'],
      ['pg-1', 'replica'],
    ]);
  });

  it('returns an empty list rather than throwing for an empty or absent status', () => {
    expect(getInstanceTopology({})).toEqual([]);
    expect(getInstanceTopology(undefined)).toEqual([]);
  });
});

describe('isSwitchoverInProgress', () => {
  it('is true when the operator is moving the primary elsewhere', () => {
    expect(
      isSwitchoverInProgress({ status: { currentPrimary: 'pg-1', targetPrimary: 'pg-2' } })
    ).toBe(true);
  });

  it('is false when current and target agree', () => {
    expect(isSwitchoverInProgress(healthy)).toBe(false);
  });

  it('is false when either side is unknown, since that is not evidence of a switchover', () => {
    expect(isSwitchoverInProgress({ status: { targetPrimary: 'pg-1' } })).toBe(false);
    expect(isSwitchoverInProgress({ status: { currentPrimary: 'pg-1' } })).toBe(false);
    expect(isSwitchoverInProgress(undefined)).toBe(false);
  });
});
