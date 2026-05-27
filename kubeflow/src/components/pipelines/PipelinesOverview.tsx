/**
 * Copyright 2025 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Link as HeadlampLink } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import Deployment from '@kinvolk/headlamp-plugin/lib/k8s/deployment';
import Service from '@kinvolk/headlamp-plugin/lib/k8s/service';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useAuthorization } from '../../hooks/useAuthorization';
import { PipelineClass } from '../../resources/pipeline';
import { PipelineExperimentClass } from '../../resources/pipelineExperiment';
import { PipelineRecurringRunClass } from '../../resources/pipelineRecurringRun';
import { PipelineRunClass } from '../../resources/pipelineRun';
import { PipelineVersionClass } from '../../resources/pipelineVersion';
import { describeResourceError } from '../common/notebookUtils';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  getPipelineDetailsPath,
  getPipelineResourceStatus,
  getPipelineRunDetailsPath,
  getPipelineVersionDetailsPath,
} from '../common/pipelineUtils';
import { SectionPage } from '../common/SectionPage';
import { PipelinesOverviewContent } from './PipelinesOverviewCards';

function parseCreationTimestamp(timestamp?: string): number {
  const parsed = Date.parse(timestamp ?? '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortByCreationTimestampDesc<T extends { metadata: { creationTimestamp?: string } }>(
  items: T[]
): T[] {
  return [...items].sort((left, right) => {
    const leftTimestamp = parseCreationTimestamp(left.metadata.creationTimestamp);
    const rightTimestamp = parseCreationTimestamp(right.metadata.creationTimestamp);
    return rightTimestamp - leftTimestamp;
  });
}

function formatAccessLabel(allowed: boolean | null, isLoading: boolean, t: any): string {
  if (isLoading) {
    return t('Checking...');
  }
  if (allowed === null) {
    return '-';
  }
  return allowed ? t('Allowed') : t('Denied');
}

/**
 * Renders the overview page for the Kubeflow Pipelines family.
 */
export function PipelinesOverview() {
  const { t } = useTranslation();
  const clusterName = useCluster();
  const [pipelines, pipelinesError] = PipelineClass.useList();
  const [pipelineVersions, pipelineVersionsError] = PipelineVersionClass.useList();
  const [pipelineRuns, pipelineRunsError] = PipelineRunClass.useList();
  const [recurringRuns, recurringRunsError] = PipelineRecurringRunClass.useList();
  const [experiments, experimentsError] = PipelineExperimentClass.useList();
  const [services, servicesError] = Service.useList();
  const [deployments, deploymentsError] = Deployment.useList();
  const pipelineAccess = useAuthorization({
    item: PipelineClass,
    authVerb: 'list',
    cluster: clusterName ?? undefined,
  });
  const versionAccess = useAuthorization({
    item: PipelineVersionClass,
    authVerb: 'list',
    cluster: clusterName ?? undefined,
  });
  const runAccess = useAuthorization({
    item: PipelineRunClass,
    authVerb: 'list',
    cluster: clusterName ?? undefined,
  });
  const recurringAccess = useAuthorization({
    item: PipelineRecurringRunClass,
    authVerb: 'list',
    cluster: clusterName ?? undefined,
  });
  const experimentAccess = useAuthorization({
    item: PipelineExperimentClass,
    authVerb: 'list',
    cluster: clusterName ?? undefined,
  });

  const isLoading =
    (pipelines === null && !pipelinesError) ||
    (pipelineVersions === null && !pipelineVersionsError) ||
    (pipelineRuns === null && !pipelineRunsError) ||
    (recurringRuns === null && !recurringRunsError) ||
    (experiments === null && !experimentsError) ||
    (services === null && !servicesError) ||
    (deployments === null && !deploymentsError);

  if (isLoading) {
    return (
      <SectionPage title={t('Pipelines Dashboard')} apiPath="/apis/pipelines.kubeflow.org/v2beta1">
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>{t('Loading Pipelines Dashboard...')}</Typography>
        </Box>
      </SectionPage>
    );
  }

  const pipelineList = pipelines ?? [];
  const versionList = pipelineVersions ?? [];
  const runList = pipelineRuns ?? [];
  const recurringRunList = recurringRuns ?? [];
  const experimentList = experiments ?? [];
  const serviceList = services ?? [];
  const deploymentList = deployments ?? [];
  const readyCount = pipelineList.filter(item => {
    return getPipelineResourceStatus(item).status === 'success';
  }).length;
  const failedCount = pipelineList.filter(item => {
    return getPipelineResourceStatus(item).status === 'error';
  }).length;

  const runSuccessCount = runList.filter(item => {
    return getPipelineResourceStatus(item).status === 'success';
  }).length;
  const runFailureCount = runList.filter(item => {
    return getPipelineResourceStatus(item).status === 'error';
  }).length;
  const runRunningCount = runList.filter(item => {
    const status = getPipelineResourceStatus(item);
    return status.label.toLowerCase().includes('running');
  }).length;

  const recurringEnabledCount = recurringRunList.filter(item => item.isEnabled).length;

  const pipelineAvailability = describeResourceError(pipelinesError);
  const versionAvailability = describeResourceError(pipelineVersionsError);
  const runAvailability = describeResourceError(pipelineRunsError);
  const recurringAvailability = describeResourceError(recurringRunsError);
  const experimentAvailability = describeResourceError(experimentsError);
  const serviceAvailability = describeResourceError(servicesError);
  const deploymentAvailability = describeResourceError(deploymentsError);
  const hasListErrors = Boolean(
    pipelineAvailability ||
      versionAvailability ||
      runAvailability ||
      recurringAvailability ||
      experimentAvailability
  );

  const nativeApiMode =
    pipelinesError?.status === 404 ? t('No') : pipelinesError ? t('Unknown') : t('Yes');

  const namespaces = new Set<string>();
  [pipelineList, versionList, runList, recurringRunList, experimentList].forEach(list => {
    list.forEach(item => {
      if (item.metadata.namespace) {
        namespaces.add(item.metadata.namespace);
      }
    });
  });

  const mlPipelineService =
    serviceList.find(service => service.metadata.name === 'ml-pipeline') ??
    serviceList.find(service => service.metadata.name?.includes('ml-pipeline'));
  const apiServiceLabel = serviceAvailability
    ? serviceAvailability
    : mlPipelineService
    ? `${mlPipelineService.metadata.name}.${mlPipelineService.metadata.namespace}`
    : '-';
  const apiPort = mlPipelineService?.spec?.ports?.[0]?.port;
  const apiEndpoint = serviceAvailability
    ? serviceAvailability
    : mlPipelineService && apiPort
    ? `${mlPipelineService.metadata.name}.${mlPipelineService.metadata.namespace}:${apiPort}`
    : '-';

  const kfpDeployments = deploymentList.filter(deployment => {
    const name = deployment.metadata.name ?? '';
    const labels = deployment.metadata.labels ?? {};
    return (
      name.includes('ml-pipeline') ||
      name.includes('kubeflow-pipelines') ||
      labels['app.kubernetes.io/part-of']?.includes('kubeflow-pipelines') ||
      labels['app.kubernetes.io/component']?.includes('pipeline')
    );
  });

  const summaryCards = [
    {
      title: t('Pipelines'),
      value: pipelineAvailability ?? pipelineList.length,
      icon: 'mdi:sitemap',
      subtitle: pipelineAvailability
        ? t('Pipeline data unavailable')
        : t('{{ready}} ready, {{failed}} failed', { ready: readyCount, failed: failedCount }),
    },
    {
      title: t('Pipeline Versions'),
      value: versionAvailability ?? versionList.length,
      icon: 'mdi:source-branch',
      subtitle: versionAvailability
        ? t('PipelineVersion data unavailable')
        : t('{{count}} total versions discovered', { count: versionList.length }),
    },
    {
      title: t('Runs'),
      value: runAvailability ?? runList.length,
      icon: 'mdi:play-circle-outline',
      subtitle: runAvailability
        ? t('Run data unavailable')
        : t('{{running}} running, {{succeeded}} succeeded, {{failed}} failed', {
            running: runRunningCount,
            succeeded: runSuccessCount,
            failed: runFailureCount,
          }),
    },
    {
      title: t('Recurring Runs'),
      value: recurringAvailability ?? recurringRunList.length,
      icon: 'mdi:calendar-refresh',
      subtitle: recurringAvailability
        ? t('Recurring run data unavailable')
        : t('{{count}} enabled', { count: recurringEnabledCount }),
    },
    {
      title: t('Experiments'),
      value: experimentAvailability ?? experimentList.length,
      icon: 'mdi:flask-outline',
      subtitle: experimentAvailability
        ? t('Experiment data unavailable')
        : t('{{count}} experiment(s)', { count: experimentList.length }),
    },
    {
      title: t('Namespaces'),
      value: namespaces.size,
      icon: 'mdi:folder-multiple',
      subtitle:
        namespaces.size > 0 ? t('KFP data across namespaces') : t('No namespaces detected yet'),
    },
  ];

  const recentPipelines = sortByCreationTimestampDesc(pipelineList).slice(0, 5);
  const recentVersions = sortByCreationTimestampDesc(versionList).slice(0, 5);
  const recentRuns = sortByCreationTimestampDesc(runList).slice(0, 5);

  const versionsPerPipeline =
    pipelineAvailability || versionAvailability
      ? pipelineAvailability || versionAvailability || t('Unavailable')
      : pipelineList.length > 0
      ? (versionList.length / pipelineList.length).toFixed(1)
      : '0.0';

  const controlPlaneRows = [
    { label: t('Cluster'), value: clusterName ?? t('Unknown') },
    {
      label: t('Detected Namespaces'),
      value: namespaces.size > 0 ? Array.from(namespaces).join(', ') : '-',
    },
    { label: t('Native API Mode'), value: nativeApiMode },
    { label: t('API Service'), value: apiServiceLabel },
    { label: t('API Endpoint'), value: apiEndpoint },
    { label: t('Versions / Pipeline'), value: versionsPerPipeline },
  ];

  const accessRows = [
    {
      resource: t('Pipelines'),
      access: formatAccessLabel(pipelineAccess.allowed, pipelineAccess.isLoading, t),
    },
    {
      resource: t('Pipeline Versions'),
      access: formatAccessLabel(versionAccess.allowed, versionAccess.isLoading, t),
    },
    {
      resource: t('Runs'),
      access: formatAccessLabel(runAccess.allowed, runAccess.isLoading, t),
    },
    {
      resource: t('Recurring Runs'),
      access: formatAccessLabel(recurringAccess.allowed, recurringAccess.isLoading, t),
    },
    {
      resource: t('Experiments'),
      access: formatAccessLabel(experimentAccess.allowed, experimentAccess.isLoading, t),
    },
  ];

  const failureRows = [
    ...pipelineList
      .filter(item => getPipelineResourceStatus(item).status === 'error')
      .map(item => ({
        kind: t('Pipeline'),
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        status: <PipelineStatusBadge resource={item} />,
        link: (
          <HeadlampLink
            routeName={getPipelineDetailsPath()}
            params={{ namespace: item.metadata.namespace, name: item.metadata.name }}
          >
            {item.metadata.name}
          </HeadlampLink>
        ),
        createdAt: item.metadata.creationTimestamp,
      })),
    ...versionList
      .filter(item => getPipelineResourceStatus(item).status === 'error')
      .map(item => ({
        kind: t('PipelineVersion'),
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        status: <PipelineStatusBadge resource={item} />,
        link: (
          <HeadlampLink
            routeName={getPipelineVersionDetailsPath()}
            params={{ namespace: item.metadata.namespace, name: item.metadata.name }}
          >
            {item.metadata.name}
          </HeadlampLink>
        ),
        createdAt: item.metadata.creationTimestamp,
      })),
    ...runList
      .filter(item => getPipelineResourceStatus(item).status === 'error')
      .map(item => ({
        kind: t('Run'),
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        status: <PipelineStatusBadge resource={item} />,
        link: (
          <HeadlampLink
            routeName={getPipelineRunDetailsPath()}
            params={{ namespace: item.metadata.namespace, name: item.metadata.name }}
          >
            {item.metadata.name}
          </HeadlampLink>
        ),
        createdAt: item.metadata.creationTimestamp,
      })),
  ].sort((left, right) => {
    const leftTimestamp = Date.parse(left.createdAt ?? '');
    const rightTimestamp = Date.parse(right.createdAt ?? '');
    return rightTimestamp - leftTimestamp;
  });

  return (
    <SectionPage title={t('Pipelines Dashboard')} apiPath="/apis/pipelines.kubeflow.org/v2beta1">
      <PipelinesOverviewContent
        summaryCards={summaryCards}
        controlPlaneRows={controlPlaneRows}
        accessRows={accessRows}
        kfpDeployments={kfpDeployments}
        failureRows={failureRows}
        recentPipelines={recentPipelines}
        recentVersions={recentVersions}
        recentRuns={recentRuns}
        versionList={versionList}
        hasListErrors={hasListErrors}
        pipelineAvailability={pipelineAvailability}
        versionAvailability={versionAvailability}
        runAvailability={runAvailability}
        deploymentAvailability={deploymentAvailability}
      />
    </SectionPage>
  );
}
