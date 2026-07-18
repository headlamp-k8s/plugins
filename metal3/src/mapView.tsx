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
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { useMemo } from 'react';
import { bareMetalHostClass } from './BareMetalHost/List';
import { findHostEdges, findOwnerMachineEdges } from './mapEdges';
import { metal3MachineClass } from './Metal3Machine/List';

/** CRD names used to detect whether each resource type exists in the cluster. */
const BAREMETALHOST_CRD = 'baremetalhosts.metal3.io';
const METAL3MACHINE_CRD = 'metal3machines.infrastructure.cluster.x-k8s.io';

/** Map source contributing the BareMetalHost nodes. */
const bareMetalHostSource = {
  id: 'metal3-baremetalhosts',
  label: 'Bare Metal Hosts',
  useData() {
    const [crd, crdError] = CustomResourceDefinition.useGet(BAREMETALHOST_CRD);
    const [hosts] = bareMetalHostClass().useList();
    return useMemo(() => {
      // CRD absent or unreadable: contribute nothing rather than loading forever.
      if (crdError) {
        return { nodes: [] };
      }
      // Still detecting the CRD, or the list has not loaded yet.
      if (!crd || !hosts) {
        return null;
      }
      return {
        nodes: hosts.map((host: KubeObject) => ({ id: host.metadata.uid, kubeObject: host })),
      };
    }, [crd, crdError, hosts]);
  },
};

/** Map source contributing the Metal3Machine nodes and their edges down to the hosts. */
const metal3MachineSource = {
  id: 'metal3-machines',
  label: 'Metal3 Machines',
  useData() {
    const [crd, crdError] = CustomResourceDefinition.useGet(METAL3MACHINE_CRD);
    const [machines] = metal3MachineClass().useList();
    const [hosts] = bareMetalHostClass().useList();
    return useMemo(() => {
      // On a bare-metal-only cluster the Metal3Machine CRD is absent: contribute
      // nothing rather than leaving the source loading forever.
      if (crdError) {
        return { nodes: [] };
      }
      // Still detecting the CRD, or the list has not loaded yet.
      if (!crd || !machines) {
        return null;
      }
      return {
        nodes: machines.map((machine: KubeObject) => ({
          id: machine.metadata.uid,
          kubeObject: machine,
        })),
        edges: [...findHostEdges(machines, hosts || []), ...findOwnerMachineEdges(machines)],
      };
    }, [crd, crdError, machines, hosts]);
  },
};

/**
 * Aggregated Metal3 map source. It draws the Metal3Machine → BareMetalHost link so
 * the Machine → Metal3Machine → BareMetalHost chain is connected in the Map view;
 * the Cluster → Machine half is drawn by the cluster-api plugin when it is installed.
 */
export const metal3Source = {
  id: 'metal3',
  label: 'Metal3',
  sources: [metal3MachineSource, bareMetalHostSource],
};
