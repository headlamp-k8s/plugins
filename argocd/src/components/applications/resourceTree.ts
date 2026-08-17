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

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import type {
  GraphEdge,
  GraphNode,
} from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import React from 'react';
import { argoIcon } from '../../argoIcon';
import { ArgoApplication, ManagedResource } from '../../resources/application';
import { ArgoAppProject } from '../../resources/appproject';
import ApplicationDetail from './Detail';
import { getGraphStatus } from './statusHelpers';

type ArgoGraphStatus = ReturnType<typeof getGraphStatus>;

const graphStatusPriority: Record<NonNullable<ArgoGraphStatus>, number> = {
  success: 1,
  warning: 2,
  error: 3,
};

function mergeGraphStatus(current: ArgoGraphStatus, candidate: ArgoGraphStatus): ArgoGraphStatus {
  if (!candidate) return current;
  if (!current || graphStatusPriority[candidate] > graphStatusPriority[current]) {
    return candidate;
  }
  return current;
}

const { KubeObject } = K8s.cluster;

/**
 * Determines if an Argo CD Application targets the local cluster.
 *
 * @param application - The Argo CD Application to evaluate.
 * @returns true if the application deploys to the local cluster, false otherwise.
 */
export function isLocalApplicationDestination(application: ArgoApplication): boolean {
  const destServer = application.spec.destination?.server;
  const destName = application.spec.destination?.name;

  return destServer === 'https://kubernetes.default.svc' || destName === 'in-cluster';
}

/**
 * Builds a stable identifier for a Kubernetes resource.
 */
export function makeDescriptorKey(
  group: string,
  version: string,
  kind: string,
  namespace: string,
  name: string
): string {
  const safeGroup = group || '';
  const safeNamespace = namespace || '';
  return `${safeGroup}/${version}/${kind}/${safeNamespace}/${name}`;
}

export function makeArgoDescriptorKey(resource: ManagedResource): string {
  return makeDescriptorKey(
    resource.group || '',
    resource.version,
    resource.kind,
    resource.namespace || '',
    resource.name
  );
}

export function makeLiveDescriptorKey(kubeObject: InstanceType<typeof KubeObject>): string {
  const apiVersion = kubeObject.jsonData.apiVersion || '';
  const [groupOrVersion, versionOnly] = apiVersion.split('/');
  const group = versionOnly ? groupOrVersion : '';
  const version = versionOnly ? versionOnly : groupOrVersion;

  return makeDescriptorKey(
    group,
    version,
    kubeObject.kind,
    kubeObject.metadata.namespace || '',
    kubeObject.metadata.name
  );
}

function ApplicationNodeDetails(props: { node: GraphNode }) {
  const obj = props.node.kubeObject;
  return React.createElement(ApplicationDetail, {
    namespace: obj?.metadata.namespace,
    name: obj?.metadata.name,
  });
}

export function makeApplicationNode(application: ArgoApplication): GraphNode {
  return {
    id: application.metadata.uid,
    kubeObject: application,
    subtitle: 'Argo CD Application',
    weight: 2000,
    status: getGraphStatus(application.syncStatus, application.healthStatus),
    detailsComponent: ApplicationNodeDetails,
    icon: argoIcon,
  };
}

/**
 * Builds nodes and edges from Argo CD Applications and local live objects.
 */
export function buildArgoCDGraph(
  applications: ArgoApplication[],
  liveObjects: InstanceType<typeof KubeObject>[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  // Map live objects by their descriptor key
  const liveObjectsByKey = new Map<string, InstanceType<typeof KubeObject>>();
  for (const obj of liveObjects) {
    if (obj) {
      liveObjectsByKey.set(makeLiveDescriptorKey(obj), obj);
    }
  }

  // Create Application nodes and their managed resources
  for (const app of applications) {
    const appNode = makeApplicationNode(app);
    if (!nodes.has(appNode.id)) {
      nodes.set(appNode.id, appNode);
    }

    const isLocal = isLocalApplicationDestination(app);
    const managedResources = app.managedResources;

    for (const res of managedResources) {
      const descriptorKey = makeArgoDescriptorKey(res);
      const liveObj = isLocal ? liveObjectsByKey.get(descriptorKey) : undefined;
      const status = getGraphStatus(res.status, res.health?.status);
      let targetId: string;

      if (liveObj) {
        targetId = liveObj.metadata.uid;
        if (!nodes.has(targetId)) {
          nodes.set(targetId, {
            id: targetId,
            kubeObject: liveObj,
            status,
          });
        } else {
          const node = nodes.get(targetId)!;
          node.status = mergeGraphStatus(node.status as ArgoGraphStatus, status);
        }
      } else {
        targetId = `argocd-managed:${app.metadata.uid}:${descriptorKey}`;
        const scope = res.namespace || 'cluster-scoped';
        const subtitle = `${res.kind} • ${scope} • ${isLocal ? 'Read-only' : 'Remote'}`;

        if (!nodes.has(targetId)) {
          nodes.set(targetId, {
            id: targetId,
            label: res.name,
            subtitle,
            status,
          });
        }
      }

      // Application -> Managed Resource Edge
      const edgeId = `managed-by-argocd:${app.metadata.uid}:${targetId}`;
      if (!edges.has(edgeId)) {
        edges.set(edgeId, {
          id: edgeId,
          source: app.metadata.uid,
          target: targetId,
          label: 'manages',
          data: { relationship: 'managed-by-argocd' },
        });
      }
    }
  }

  // Create Kubernetes ownership edges for live objects in the graph
  const resolvedUids = new Set(nodes.keys());
  for (const obj of liveObjects) {
    const childUid = obj.metadata.uid;
    if (resolvedUids.has(childUid) && obj.metadata.ownerReferences) {
      for (const ownerRef of obj.metadata.ownerReferences) {
        const ownerUid = ownerRef.uid;
        if (resolvedUids.has(ownerUid)) {
          const edgeId = `owner-reference:${ownerUid}:${childUid}`;
          if (!edges.has(edgeId)) {
            edges.set(edgeId, {
              id: edgeId,
              source: ownerUid,
              target: childUid,
              label: 'owns',
              data: { relationship: 'kubernetes-owner-reference' },
            });
          }
        }
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
}

/**
 * Builds the optional AppProject-to-Application hierarchy overlay.
 * Applications without a matching, listable AppProject remain Application roots.
 */
export function buildArgoCDProjectGraph(
  projects: ArgoAppProject[],
  applications: ArgoApplication[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  for (const project of projects) {
    const projectApplications = applications.filter(
      application =>
        application.metadata.namespace === project.metadata.namespace &&
        (application.spec.project || 'default') === project.metadata.name
    );
    if (projectApplications.length === 0) continue;

    const projectStatus = projectApplications.reduce<ArgoGraphStatus>((current, application) => {
      const applicationStatus = getGraphStatus(application.syncStatus, application.healthStatus);
      return mergeGraphStatus(current, applicationStatus);
    }, undefined);

    nodes.set(project.metadata.uid, {
      id: project.metadata.uid,
      kubeObject: project,
      subtitle: 'Argo CD AppProject',
      weight: 3000,
      status: projectStatus,
    });

    for (const application of projectApplications) {
      const edgeId = `appproject-member:${project.metadata.uid}:${application.metadata.uid}`;
      edges.set(edgeId, {
        id: edgeId,
        source: project.metadata.uid,
        target: application.metadata.uid,
        label: 'contains',
        data: { relationship: 'appproject-member' },
      });
    }
  }

  return { nodes: Array.from(nodes.values()), edges: Array.from(edges.values()) };
}
