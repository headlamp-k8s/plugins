import React from 'react';
import { useLocation } from 'react-router-dom';

interface ViewContext {
  path: string;
  resourceType?: string;
  resourceName?: string;
  namespace?: string;
}

export function getViewContext(pathname: string): ViewContext {
  const pathParts = pathname.split('/').filter(Boolean);
  const context: ViewContext = {
    path: pathname,
  };

  // Handle cluster list view
  if (pathname === '/') {
    return {
      path: pathname,
      resourceType: 'clusters',
    };
  }

  // Handle workloads view
  if (pathname.includes('/workloads')) {
    return {
      path: pathname,
      resourceType: 'workloads',
    };
  }

  // Handle cluster events view
  if (pathname.endsWith('/')) {
    return {
      path: pathname,
      resourceType: 'events',
    };
  }

  // Handle URLs in format /c/:clusterName/resources or /c/:clusterName/resourceType/namespace/name
  if (pathParts.length >= 2 && pathParts[0] === 'c') {
    if (pathParts.length >= 3) {
      context.resourceType = pathParts[2];

      // If we have namespace and name
      if (pathParts.length >= 4) {
        context.namespace = pathParts[3];
      }
      if (pathParts.length >= 5) {
        context.resourceName = pathParts[4];
      }
    }
  }

  return context;
}

export function generatePrompts(context: ViewContext): string[] {
  const basePrompts = {
    clusters: [
      'Show me the health status of my clusters',
      'Fetch all resources across my clusters',
      'Compare resource usage between clusters',
    ],
    events: [
      'Show me recent warning events',
      'Fetch events related to pod failures',
      'Fetch events affecting my deployments',
    ],
    workloads: [
      'Show me all running pods',
      'Fetch deployments with their replicas',
      'Fetch workloads with resource issues',
    ],
    pods: [
      'Show me pods with high resource usage',
      'Fetch pods in failed state',
      'Fetch pods with recent restarts',
    ],
    deployments: [
      'Show me deployment rollouts',
      'Fetch deployments with scaling issues',
      'Fetch deployments with failed pods',
    ],
    statefulsets: [
      'Show me StatefulSet replicas status',
      'Fetch StatefulSets with scaling issues',
      'Fetch StatefulSets with pod failures',
    ],
    daemonsets: [
      'Show me DaemonSet node coverage',
      'Fetch DaemonSets with pod issues',
      'Fetch DaemonSets with update problems',
    ],
    jobs: ['Show me failed jobs', 'Fetch active CronJobs', 'Fetch jobs with completion issues'],
    cronjobs: [
      'Show me CronJob schedules',
      'Fetch CronJobs with failed executions',
      'Fetch CronJobs with scheduling issues',
    ],
    replicasets: [
      'Show me ReplicaSet scaling status',
      'Fetch ReplicaSets with pod issues',
      'Fetch ReplicaSets with update problems',
    ],
    services: [
      'Show me service endpoints',
      'Fetch services with no endpoints',
      'Fetch services with connection issues',
    ],
    endpoints: [
      'Show me endpoint subsets',
      'Fetch endpoints with no addresses',
      'Fetch endpoints with connection issues',
    ],
    configmaps: [
      'Show me ConfigMap usage',
      'Fetch ConfigMaps by namespace',
      'Fetch ConfigMaps with recent changes',
    ],
    secrets: [
      'Show me Secret usage',
      'Fetch Secrets by namespace',
      'Fetch Secrets with expiration dates',
    ],
    persistentvolumes: [
      'Show me PV status',
      'Fetch PVs with issues',
      'Fetch PVs with capacity problems',
    ],
    persistentvolumeclaims: [
      'Show me PVC status',
      'Fetch PVCs with issues',
      'Fetch PVCs with capacity problems',
    ],
    storageclasses: [
      'Show me StorageClass details',
      'Fetch StorageClasses by provisioner',
      'Fetch StorageClasses with issues',
    ],
    namespaces: [
      'Show me namespace status',
      'Fetch namespaces with issues',
      'Fetch namespaces with resource quotas',
    ],
    nodes: ['Show me node status', 'Fetch nodes with issues', 'Fetch nodes with resource pressure'],
    ingresses: [
      'Show me ingress rules',
      'Fetch ingresses with issues',
      'Fetch ingresses with routing problems',
    ],
    ingressclasses: [
      'Show me IngressClass details',
      'Fetch IngressClasses by controller',
      'Fetch IngressClasses with issues',
    ],
    networkpolicies: [
      'Show me NetworkPolicy rules',
      'Fetch NetworkPolicies by namespace',
      'Fetch NetworkPolicies with issues',
    ],
    serviceaccounts: [
      'Show me ServiceAccount details',
      'Fetch ServiceAccounts by namespace',
      'Fetch ServiceAccounts with issues',
    ],
    roles: ['Show me Role rules', 'Fetch Roles by namespace', 'Fetch Roles with issues'],
    rolebindings: [
      'Show me RoleBinding subjects',
      'Fetch RoleBindings by namespace',
      'Fetch RoleBindings with issues',
    ],
    clusterroles: [
      'Show me ClusterRole rules',
      'Fetch ClusterRoles with issues',
      'Fetch ClusterRoles with permissions',
    ],
    clusterrolebindings: [
      'Show me ClusterRoleBinding subjects',
      'Fetch ClusterRoleBindings with issues',
      'Fetch ClusterRoleBindings with permissions',
    ],
    resourcequotas: [
      'Show me ResourceQuota limits',
      'Fetch ResourceQuotas by namespace',
      'Fetch ResourceQuotas with issues',
    ],
    limitranges: [
      'Show me LimitRange details',
      'Fetch LimitRanges by namespace',
      'Fetch LimitRanges with issues',
    ],
    horizontalpodautoscalers: [
      'Show me HPA metrics',
      'Fetch HPAs with scaling issues',
      'Fetch HPAs with target issues',
    ],
    poddisruptionbudgets: [
      'Show me PDB status',
      'Fetch PDBs with issues',
      'Fetch PDBs with availability problems',
    ],
    priorityclasses: [
      'Show me PriorityClass details',
      'Fetch PriorityClasses with issues',
      'Fetch PriorityClasses with conflicts',
    ],
    runtimeclasses: [
      'Show me RuntimeClass details',
      'Fetch RuntimeClasses with issues',
      'Fetch RuntimeClasses with configuration problems',
    ],
    volumesnapshots: [
      'Show me VolumeSnapshot status',
      'Fetch VolumeSnapshots by namespace',
      'Fetch VolumeSnapshots with issues',
    ],
    volumeattachments: [
      'Show me VolumeAttachment status',
      'Fetch VolumeAttachments with issues',
      'Fetch VolumeAttachments with connection problems',
    ],
    csidrivers: [
      'Show me CSIDriver details',
      'Fetch CSIDrivers with issues',
      'Fetch CSIDrivers with configuration problems',
    ],
    csinodes: [
      'Show me CSINode status',
      'Fetch CSINodes with issues',
      'Fetch CSINodes with driver problems',
    ],
  };

  // If we're viewing a specific resource
  if (context.resourceName) {
    return [
      `Show me the status of ${context.resourceName}`,
      `Fetch events related to ${context.resourceName}`,
      `Fetch issues with ${context.resourceName}`,
    ];
  }

  // If we're viewing a list of resources
  if (context.resourceType && basePrompts[context.resourceType]) {
    return basePrompts[context.resourceType];
  }

  // If we couldn't determine the resource type, return empty array
  return [];
}

export function useDynamicPrompts(): string[] {
  const location = useLocation();

  // Use useMemo to avoid recalculating prompts on every render
  // Only recalculate when the pathname changes
  return React.useMemo(() => {
    const context = getViewContext(location.pathname);
    return generatePrompts(context);
  }, [location.pathname]);
}
