import { CapiClusterCacheChart } from '../../Chart/CapiChart/CapiClusterCacheChart';
import { CapiQueueChart } from '../../Chart/CapiChart/CapiQueueChart';
import { CapiReconcileChart } from '../../Chart/CapiChart/CapiReconcileChart';
import { CapiReconcileDurationChart } from '../../Chart/CapiChart/CapiReconcileDurationChart';
import { CapiSsaCacheChart } from '../../Chart/CapiChart/CapiSsaCacheChart';
import { CapiWebhookChart } from '../../Chart/CapiChart/CapiWebhookChart';
import { CapiWorkersChart } from '../../Chart/CapiChart/CapiWorkersChart';
import {
  capiActiveWorkersQuery,
  capiClientCacheWaitDurationQuery,
  capiClusterCacheConnectionUpQuery,
  capiClusterCacheHealthcheckQuery,
  capiClusterCacheHealthcheckRateQuery,
  capiMaxConcurrentReconcilesQuery,
  capiReconcileDurationQuery,
  capiReconcileErrorRateQuery,
  capiReconcileRateQuery,
  capiSsaCacheHitsRateQuery,
  capiSsaCacheMissesRateQuery,
  capiWebhookDurationQuery,
  capiWebhookRateQuery,
  capiWorkqueueAddsRateQuery,
  capiWorkqueueDepthQuery,
  capiWorkqueueRetriesRateQuery,
} from './capiQueries';

/**
 * Generates reconciliation and workqueue chart configs for a given controller.
 *
 * @param controller - The name of the CAPI controller (e.g., 'machinedeployment', 'cluster').
 * @returns An array of chart configurations for the given controller's reconcile operations, workers, queue, and SSA cache.
 */
function reconcileCharts(controller: string) {
  return [
    {
      key: 'reconcile',
      label: 'Reconcile Rate',
      icon: 'mdi:refresh',
      queries: {
        successQuery: capiReconcileRateQuery(controller, 'success'),
        errorQuery: capiReconcileErrorRateQuery(controller),
      },
      component: CapiReconcileChart,
    },
    {
      key: 'duration',
      label: 'Reconcile Duration',
      icon: 'mdi:timer-outline',
      queries: {
        p50Query: capiReconcileDurationQuery(controller, 0.5),
        p99Query: capiReconcileDurationQuery(controller, 0.99),
      },
      component: CapiReconcileDurationChart,
    },
    {
      key: 'workers',
      label: 'Workers',
      icon: 'mdi:account-hard-hat',
      queries: {
        activeWorkersQuery: capiActiveWorkersQuery(controller),
        maxWorkersQuery: capiMaxConcurrentReconcilesQuery(controller),
      },
      component: CapiWorkersChart,
    },
    {
      key: 'queue',
      label: 'Work Queue',
      icon: 'mdi:format-list-bulleted',
      queries: {
        depthQuery: capiWorkqueueDepthQuery(controller),
        addsRateQuery: capiWorkqueueAddsRateQuery(controller),
        retriesRateQuery: capiWorkqueueRetriesRateQuery(controller),
      },
      component: CapiQueueChart,
    },
    {
      key: 'ssa-cache',
      label: 'SSA Cache',
      icon: 'mdi:database-search',
      queries: {
        hitsRateQuery: capiSsaCacheHitsRateQuery(controller),
        missesRateQuery: capiSsaCacheMissesRateQuery(controller),
      },
      component: CapiSsaCacheChart,
    },
  ];
}

/**
 * Generates admission webhook chart configurations for a specific resource kind.
 *
 * @param kind - The resource kind the webhook handles (e.g., 'MachineDeployment', 'Cluster').
 * @returns An array of chart configurations for monitoring the performance of the specified admission webhook.
 */
function webhookCharts(kind: string) {
  return [
    {
      key: 'webhook',
      label: 'Webhook Performance',
      icon: 'mdi:webhook',
      queries: {
        successRateQuery: capiWebhookRateQuery(kind, true),
        errorRateQuery: capiWebhookRateQuery(kind, false),
        p50DurationQuery: capiWebhookDurationQuery(kind, 0.5),
        p99DurationQuery: capiWebhookDurationQuery(kind, 0.99),
      },
      component: CapiWebhookChart,
    },
  ];
}

/**
 * Retrieves the Prometheus chart configurations specific to MachineDeployments.
 *
 * @returns An array containing reconcile and webhook chart configurations for MachineDeployments.
 */
export const getMachineDeploymentChartConfigs = () => [
  ...reconcileCharts('machinedeployment'),
  ...webhookCharts('MachineDeployment'),
];

/**
 * Retrieves the Prometheus chart configurations specific to MachineSets.
 *
 * @returns An array containing reconcile and webhook chart configurations for MachineSets.
 */
export const getMachineSetChartConfigs = () => [
  ...reconcileCharts('machineset'),
  ...webhookCharts('MachineSet'),
];

/**
 * Retrieves the Prometheus chart configurations specific to Clusters, including cache monitoring.
 *
 * @param name - The name of the cluster.
 * @param namespace - The namespace where the cluster resides.
 * @returns An array containing cluster cache, reconcile, and webhook chart configurations.
 */
export const getClusterChartConfigs = (name: string, namespace: string) => [
  {
    key: 'cache',
    label: 'Cluster Cache',
    icon: 'mdi:database-sync',
    queries: {
      connectionUpQuery: capiClusterCacheConnectionUpQuery(name, namespace),
      healthcheckQuery: capiClusterCacheHealthcheckQuery(name, namespace),
      healthcheckSuccessRateQuery: capiClusterCacheHealthcheckRateQuery(name, namespace, true),
      healthcheckFailureRateQuery: capiClusterCacheHealthcheckRateQuery(name, namespace, false),
      clientCacheWaitQuery: capiClientCacheWaitDurationQuery(),
    },
    component: CapiClusterCacheChart,
  },
  ...reconcileCharts('cluster'),
  ...webhookCharts('Cluster'),
];

/**
 * Retrieves the Prometheus chart configurations specific to Machines.
 *
 * @returns An array containing reconcile and webhook chart configurations for Machines.
 */
export const getMachineChartConfigs = () => [
  ...reconcileCharts('machine'),
  ...webhookCharts('Machine'),
];

/**
 * Retrieves the Prometheus chart configurations specific to MachinePools.
 *
 * @returns An array containing reconcile and webhook chart configurations for MachinePools.
 */
export const getMachinePoolChartConfigs = () => [
  ...reconcileCharts('machinepool'),
  ...webhookCharts('MachinePool'),
];

/**
 * Retrieves the Prometheus chart configurations specific to KubeadmControlPlanes.
 *
 * @returns An array containing reconcile and webhook chart configurations for KubeadmControlPlanes.
 */
export const getKubeadmControlPlaneChartConfigs = () => [
  ...reconcileCharts('kubeadmcontrolplane'),
  ...webhookCharts('KubeadmControlPlane'),
];
