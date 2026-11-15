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

import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { describe, expect, it } from 'vitest';
import {
  computeOverview,
  groupByLabel,
  inProgressHosts,
  labelKeys,
  timeInState,
} from './overviewStats';

/** Builds a minimal BareMetalHost-shaped object for the aggregation. */
function host(opts: {
  name: string;
  op?: string;
  prov?: string;
  online?: boolean;
  consumer?: boolean;
  consumerKind?: string;
  errorType?: string;
  labels?: Record<string, string>;
}): KubeObject {
  return {
    metadata: { name: opts.name, uid: opts.name },
    jsonData: {
      metadata: { name: opts.name, ...(opts.labels ? { labels: opts.labels } : {}) },
      spec: {
        ...(opts.online !== undefined ? { online: opts.online } : {}),
        ...(opts.consumer || opts.consumerKind
          ? {
              consumerRef: {
                name: 'consumer',
                ...(opts.consumerKind ? { kind: opts.consumerKind } : {}),
              },
            }
          : {}),
      },
      status: {
        operationalStatus: opts.op ?? 'OK',
        provisioning: { state: opts.prov ?? 'provisioned' },
        ...(opts.errorType ? { errorType: opts.errorType } : {}),
      },
    },
  } as unknown as KubeObject;
}

describe('computeOverview', () => {
  it('returns zeros for an empty fleet', () => {
    const s = computeOverview([]);
    expect(s.total).toBe(0);
    expect(s.attention).toEqual([]);
  });

  it('aggregates counts across the status axes', () => {
    const hosts = [
      host({ name: 'h1', op: 'OK', prov: 'available', online: true }),
      host({ name: 'h2', op: 'OK', prov: 'provisioned', online: true, consumer: true }),
      host({
        name: 'h3',
        op: 'error',
        prov: 'provisioned',
        online: true,
        consumer: true,
        errorType: 'x',
      }),
      host({ name: 'h4', op: 'OK', prov: 'inspecting', online: true }),
      host({ name: 'h5', op: 'error', prov: 'registering', online: false, errorType: 'y' }),
    ];
    const s = computeOverview(hosts);
    expect(s.total).toBe(5);
    expect(s.available).toBe(1);
    expect(s.provisioned).toBe(2);
    expect(s.error).toBe(2);
    expect(s.offline).toBe(1);
    expect(s.claimed).toBe(2);
    expect(s.free).toBe(3);
    expect(s.byOperationalStatus).toEqual({ OK: 3, error: 2 });
    expect(s.byProvisioningState).toEqual({
      available: 1,
      provisioned: 2,
      inspecting: 1,
      registering: 1,
    });
  });

  it('counts hosts backing a Metal3Machine', () => {
    const s = computeOverview([
      host({ name: 'a', consumerKind: 'Metal3Machine' }),
      host({ name: 'b', consumerKind: 'HostClaim' }),
      host({ name: 'c' }),
    ]);
    expect(s.claimed).toBe(2);
    expect(s.free).toBe(1);
    expect(s.backingMachine).toBe(1);
  });

  it('counts observed power state, not intent, and names empty vs missing labels distinctly', () => {
    const h = (name: string, poweredOn: boolean, rack?: string) =>
      ({
        metadata: { name, uid: name },
        jsonData: {
          metadata: { name, ...(rack !== undefined ? { labels: { rack } } : {}) },
          // spec.online is the opposite of the observed state, to prove we read status.
          spec: { online: !poweredOn },
          status: { operationalStatus: 'OK', provisioning: { state: 'provisioned' }, poweredOn },
        },
      } as unknown as KubeObject);

    const hosts = [h('a', true, 'r1'), h('b', false, ''), h('c', true)];
    expect(computeOverview(hosts).poweredOn).toBe(2);
    expect(
      groupByLabel(hosts, 'rack')
        .map(f => f.name)
        .sort()
    ).toEqual(['(empty)', '(no rack)', 'r1']);
  });

  it('groups hosts into fleets by a label and lists the label keys', () => {
    const hosts = [
      host({ name: 'a', labels: { rack: 'r1' } }),
      host({ name: 'b', labels: { rack: 'r1' } }),
      host({ name: 'c', labels: { rack: 'r2' } }),
      host({ name: 'd' }),
    ];
    expect(labelKeys(hosts)).toEqual(['rack']);
    expect(groupByLabel(hosts, '').map(f => f.name)).toEqual(['All hosts']);
    const fleets = groupByLabel(hosts, 'rack');
    expect(fleets.map(f => `${f.name}:${f.hosts.length}`)).toEqual(['(no rack):1', 'r1:2', 'r2:1']);
  });

  it('measures time in state from the in-flight operation, longest first', () => {
    const now = Date.parse('2026-08-04T12:00:00Z');
    const inFlight = (name: string, state: string, key: string, start: string) =>
      ({
        metadata: { name, uid: name },
        jsonData: {
          metadata: { name },
          spec: {},
          status: {
            operationalStatus: 'OK',
            provisioning: { state },
            operationHistory: { [key]: { start, end: null } },
          },
        },
      } as unknown as KubeObject);

    const inspecting = inFlight('insp', 'inspecting', 'inspect', '2026-08-04T09:00:00Z'); // 3h
    const provisioning = inFlight('prov', 'provisioning', 'provision', '2026-08-04T11:30:00Z'); // 30m
    const settled = host({ name: 'done', prov: 'provisioned' });

    expect(timeInState(inspecting, now)).toBe(3 * 60 * 60 * 1000);
    // A finished operation (end set) is not timeable, even in a transitional state.
    const finished = {
      ...inspecting,
      jsonData: {
        ...inspecting.jsonData,
        status: {
          ...inspecting.jsonData.status,
          operationHistory: {
            inspect: { start: '2026-08-04T09:00:00Z', end: '2026-08-04T09:05:00Z' },
          },
        },
      },
    } as unknown as KubeObject;
    expect(timeInState(finished, now)).toBeNull();

    const rows = inProgressHosts([settled, provisioning, inspecting], now);
    expect(rows.map(r => r.host.metadata.name)).toEqual(['insp', 'prov']);
    expect(rows[0].durationMs).toBe(3 * 60 * 60 * 1000);
  });

  it('lists hosts needing attention, errors first', () => {
    const hosts = [
      host({ name: 'ok', op: 'OK' }),
      host({ name: 'delayed', op: 'delayed' }),
      host({ name: 'broken', op: 'error', errorType: 'z' }),
    ];
    const s = computeOverview(hosts);
    expect(s.attention.map(h => h.metadata.name)).toEqual(['broken', 'delayed']);
  });

  it('treats detached and servicing as informational, not attention', () => {
    const hosts = [
      host({ name: 'detached', op: 'detached' }),
      host({ name: 'servicing', op: 'servicing' }),
      host({ name: 'broken', op: 'error', errorType: 'z' }),
    ];
    const s = computeOverview(hosts);
    expect(s.attention.map(h => h.metadata.name)).toEqual(['broken']);
  });
});
