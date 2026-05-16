import { CapiClusterCacheChart } from '../../components/Chart/CapiChart/CapiClusterCacheChart';
import { CapiQueueChart } from '../../components/Chart/CapiChart/CapiQueueChart';
import { CapiReconcileChart } from '../../components/Chart/CapiChart/CapiReconcileChart';
import { CapiReconcileDurationChart } from '../../components/Chart/CapiChart/CapiReconcileDurationChart';
import { CapiSsaCacheChart } from '../../components/Chart/CapiChart/CapiSsaCacheChart';
import { CapiWebhookChart } from '../../components/Chart/CapiChart/CapiWebhookChart';
import { CapiWorkersChart } from '../../components/Chart/CapiChart/CapiWorkersChart';
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
 * Generates admission webhook chart configs.
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

export const getMachineDeploymentChartConfigs = () => [
  ...reconcileCharts('machinedeployment'),
  ...webhookCharts('MachineDeployment'),
];

export const getMachineSetChartConfigs = () => [
  ...reconcileCharts('machineset'),
  ...webhookCharts('MachineSet'),
];

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

export const getMachineChartConfigs = () => [
  ...reconcileCharts('machine'),
  ...webhookCharts('Machine'),
];

export const getMachinePoolChartConfigs = () => [
  ...reconcileCharts('machinepool'),
  ...webhookCharts('MachinePool'),
];

export const getKubeadmControlPlaneChartConfigs = () => [
  ...reconcileCharts('kubeadmcontrolplane'),
  ...webhookCharts('KubeadmControlPlane'),
];
