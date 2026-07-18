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

import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { describe, expect, it } from 'vitest';
import { findHostEdges, findOwnerMachineEdges } from './mapEdges';
import { HOST_ANNOTATION } from './Metal3Machine/hostAnnotation';

/** Builds a minimal Metal3Machine-shaped object carrying the host annotation. */
function machine(uid: string, hostRef?: string): KubeObject {
  return {
    metadata: { uid },
    jsonData: {
      metadata: { uid, annotations: hostRef ? { [HOST_ANNOTATION]: hostRef } : {} },
    },
  } as unknown as KubeObject;
}

/** Builds a minimal BareMetalHost-shaped object. */
function host(uid: string, namespace: string, name: string): KubeObject {
  return {
    metadata: { uid },
    jsonData: { metadata: { uid, namespace, name } },
  } as unknown as KubeObject;
}

/** Builds a Metal3Machine-shaped object carrying an ownerReference. */
function ownedMachine(
  uid: string,
  owner?: { kind: string; apiVersion: string; uid: string }
): KubeObject {
  return {
    metadata: { uid },
    jsonData: {
      metadata: {
        uid,
        ownerReferences: owner
          ? [{ kind: owner.kind, apiVersion: owner.apiVersion, uid: owner.uid, name: 'owner' }]
          : [],
      },
    },
  } as unknown as KubeObject;
}

describe('findHostEdges', () => {
  it('links a machine to the host named in its annotation', () => {
    const machines = [machine('m1', 'metal3/host-01')];
    const hosts = [host('h1', 'metal3', 'host-01')];
    expect(findHostEdges(machines, hosts)).toEqual([{ id: 'm1-h1', source: 'm1', target: 'h1' }]);
  });

  it('ignores a machine with no host annotation', () => {
    expect(findHostEdges([machine('m1')], [host('h1', 'metal3', 'host-01')])).toEqual([]);
  });

  it('ignores a machine whose annotation names a host that is not present', () => {
    const machines = [machine('m1', 'metal3/missing')];
    const hosts = [host('h1', 'metal3', 'host-01')];
    expect(findHostEdges(machines, hosts)).toEqual([]);
  });

  it('matches on namespace as well as name', () => {
    const machines = [machine('m1', 'other-ns/host-01')];
    const hosts = [host('h1', 'metal3', 'host-01')];
    expect(findHostEdges(machines, hosts)).toEqual([]);
  });

  it('builds one edge per linked machine', () => {
    const machines = [machine('m1', 'metal3/host-01'), machine('m2', 'metal3/host-02')];
    const hosts = [host('h1', 'metal3', 'host-01'), host('h2', 'metal3', 'host-02')];
    expect(findHostEdges(machines, hosts)).toEqual([
      { id: 'm1-h1', source: 'm1', target: 'h1' },
      { id: 'm2-h2', source: 'm2', target: 'h2' },
    ]);
  });
});

describe('findOwnerMachineEdges', () => {
  it('links a Metal3Machine to the Cluster API Machine that owns it', () => {
    const machines = [
      ownedMachine('m1', { kind: 'Machine', apiVersion: 'cluster.x-k8s.io/v1beta1', uid: 'cap1' }),
    ];
    expect(findOwnerMachineEdges(machines)).toEqual([
      { id: 'cap1-m1', source: 'cap1', target: 'm1' },
    ]);
  });

  it('ignores a Metal3Machine with no ownerReferences', () => {
    expect(findOwnerMachineEdges([ownedMachine('m1')])).toEqual([]);
  });

  it('ignores an owner that is not a Machine', () => {
    const machines = [
      ownedMachine('m1', { kind: 'Cluster', apiVersion: 'cluster.x-k8s.io/v1beta1', uid: 'c1' }),
    ];
    expect(findOwnerMachineEdges(machines)).toEqual([]);
  });

  it('ignores a Machine owner from a different API group', () => {
    const machines = [
      ownedMachine('m1', { kind: 'Machine', apiVersion: 'other.example.com/v1', uid: 'x1' }),
    ];
    expect(findOwnerMachineEdges(machines)).toEqual([]);
  });

  it('accepts any served Cluster API version', () => {
    const machines = [
      ownedMachine('m1', { kind: 'Machine', apiVersion: 'cluster.x-k8s.io/v1beta2', uid: 'cap1' }),
    ];
    expect(findOwnerMachineEdges(machines)).toEqual([
      { id: 'cap1-m1', source: 'cap1', target: 'm1' },
    ]);
  });
});
