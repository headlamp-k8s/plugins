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

function sortByCreationTimestampDesc<T extends { metadata: { creationTimestamp?: string } }>(
  items: T[]
): T[] {
  return [...items].sort((left, right) => {
    const leftTimestamp = Date.parse(left.metadata.creationTimestamp ?? '');
    const rightTimestamp = Date.parse(right.metadata.creationTimestamp ?? '');
    return rightTimestamp - leftTimestamp;
  });
}

function formatAccessLabel(allowed: boolean | null, isLoading: boolean): string {
  if (isLoading) {
    return 'Checking...';
  }
  if (allowed === null) {
    return '-';
  }
  return allowed ? 'Allowed' : 'Denied';
}

/**
 * Renders the overview page for the Kubeflow Pipelines family.
 */
export function PipelinesOverview() {
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
      <SectionPage title="Pipelines Dashboard" apiPath="/apis/pipelines.kubeflow.org/v2beta1">
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading Pipelines Dashboard...</Typography>
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

  const nativeApiMode = pipelinesError?.status === 404 ? 'No' : 'Yes';

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
      title: 'Pipelines',
      value: pipelineAvailability ?? pipelineList.length,
      icon: 'mdi:sitemap',
      subtitle: pipelineAvailability
        ? 'Pipeline data unavailable'
        : `${readyCount} ready, ${failedCount} failed`,
    },
    {
      title: 'Pipeline Versions',
      value: versionAvailability ?? versionList.length,
      icon: 'mdi:source-branch',
      subtitle: versionAvailability
        ? 'PipelineVersion data unavailable'
        : `${versionList.length} total versions discovered`,
    },
    {
      title: 'Runs',
      value: runAvailability ?? runList.length,
      icon: 'mdi:play-circle-outline',
      subtitle: runAvailability
        ? 'Run data unavailable'
        : `${runRunningCount} running, ${runSuccessCount} succeeded, ${runFailureCount} failed`,
    },
    {
      title: 'Recurring Runs',
      value: recurringAvailability ?? recurringRunList.length,
      icon: 'mdi:calendar-refresh',
      subtitle: recurringAvailability
        ? 'Recurring run data unavailable'
        : `${recurringEnabledCount} enabled`,
    },
    {
      title: 'Experiments',
      value: experimentAvailability ?? experimentList.length,
      icon: 'mdi:flask-outline',
      subtitle: experimentAvailability
        ? 'Experiment data unavailable'
        : `${experimentList.length} experiment${experimentList.length !== 1 ? 's' : ''}`,
    },
    {
      title: 'Namespaces',
      value: namespaces.size,
      icon: 'mdi:folder-multiple',
      subtitle: namespaces.size > 0 ? 'KFP data across namespaces' : 'No namespaces detected yet',
    },
  ];

  const recentPipelines = sortByCreationTimestampDesc(pipelineList).slice(0, 5);
  const recentVersions = sortByCreationTimestampDesc(versionList).slice(0, 5);
  const recentRuns = sortByCreationTimestampDesc(runList).slice(0, 5);

  const versionsPerPipeline =
    pipelineAvailability || versionAvailability
      ? pipelineAvailability || versionAvailability || 'Unavailable'
      : pipelineList.length > 0
      ? (versionList.length / pipelineList.length).toFixed(1)
      : '0.0';

  const controlPlaneRows = [
    { label: 'Cluster', value: clusterName ?? 'Unknown' },
    {
      label: 'Detected Namespaces',
      value: namespaces.size > 0 ? Array.from(namespaces).join(', ') : '-',
    },
    { label: 'Native API Mode', value: nativeApiMode },
    { label: 'API Service', value: apiServiceLabel },
    { label: 'API Endpoint', value: apiEndpoint },
    { label: 'Versions / Pipeline', value: versionsPerPipeline },
  ];

  const accessRows = [
    {
      resource: 'Pipelines',
      access: formatAccessLabel(pipelineAccess.allowed, pipelineAccess.isLoading),
    },
    {
      resource: 'Pipeline Versions',
      access: formatAccessLabel(versionAccess.allowed, versionAccess.isLoading),
    },
    {
      resource: 'Runs',
      access: formatAccessLabel(runAccess.allowed, runAccess.isLoading),
    },
    {
      resource: 'Recurring Runs',
      access: formatAccessLabel(recurringAccess.allowed, recurringAccess.isLoading),
    },
    {
      resource: 'Experiments',
      access: formatAccessLabel(experimentAccess.allowed, experimentAccess.isLoading),
    },
  ];

  const failureRows = [
    ...pipelineList
      .filter(item => getPipelineResourceStatus(item).status === 'error')
      .map(item => ({
        kind: 'Pipeline',
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
        kind: 'PipelineVersion',
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
        kind: 'Run',
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
    <SectionPage title="Pipelines Dashboard" apiPath="/apis/pipelines.kubeflow.org/v2beta1">
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
