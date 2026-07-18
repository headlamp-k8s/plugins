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
import { HOST_ANNOTATION, parseHostAnnotation } from './Metal3Machine/hostAnnotation';

/** A single edge in the map: `source` and `target` are node uids. */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

/**
 * Builds the Metal3Machine → BareMetalHost edges from each machine's
 * `metal3.io/BareMetalHost` annotation. This is the one link in the chain Headlamp
 * cannot derive on its own: it is a consumerRef/annotation pair, not an
 * ownerReference, so the default map leaves the machine and its host disconnected.
 *
 * @param machines - The Metal3Machine list.
 * @param hosts - The BareMetalHost list, used to resolve each annotation to a host.
 * @returns One edge per machine that names a host present in the list.
 */
export function findHostEdges(machines: KubeObject[], hosts: KubeObject[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  machines.forEach(machine => {
    const ref = parseHostAnnotation(machine.jsonData.metadata?.annotations?.[HOST_ANNOTATION]);
    if (!ref) {
      return;
    }
    const host = hosts.find(
      h =>
        h.jsonData.metadata?.namespace === ref.namespace && h.jsonData.metadata?.name === ref.name
    );
    if (host) {
      edges.push({
        id: `${machine.metadata.uid}-${host.metadata.uid}`,
        source: machine.metadata.uid,
        target: host.metadata.uid,
      });
    }
  });
  return edges;
}

/** API group and kind of the Cluster API Machine that owns a Metal3Machine. */
const MACHINE_OWNER_GROUP = 'cluster.x-k8s.io';
const MACHINE_OWNER_KIND = 'Machine';

/**
 * Builds the Cluster API Machine → Metal3Machine edges from each Metal3Machine's
 * ownerReference back to its Machine. Cluster API sets this controller reference
 * when a Machine claims its infrastructure. Neither the cluster-api plugin nor
 * Headlamp's core draws it, because each only links resources it owns and this
 * reference spans the two, so the Metal3 plugin emits it here to close the
 * Machine → Metal3Machine → BareMetalHost chain in the Map. The edge targets the
 * Machine's uid, so it merges onto the node the cluster-api plugin contributes.
 *
 * @param machines - The Metal3Machine list.
 * @returns One edge per Metal3Machine owned by a Cluster API Machine.
 */
export function findOwnerMachineEdges(machines: KubeObject[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  machines.forEach(machine => {
    const owners = machine.jsonData.metadata?.ownerReferences ?? [];
    owners.forEach(owner => {
      const group = owner.apiVersion?.split('/')[0];
      if (owner.kind !== MACHINE_OWNER_KIND || group !== MACHINE_OWNER_GROUP || !owner.uid) {
        return;
      }
      edges.push({
        id: `${owner.uid}-${machine.metadata.uid}`,
        source: owner.uid,
        target: machine.metadata.uid,
      });
    });
  });
  return edges;
}
