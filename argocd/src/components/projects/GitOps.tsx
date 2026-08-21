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

import {
  Link,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Tooltip, Typography } from '@mui/material';
import { ArgoApplication } from '../../resources/application';
import { safeRepositoryIdentifier } from '../../resources/applicationset';
import { getHealthStatus, getSyncStatus } from '../applications/statusHelpers';

export interface HeadlampProjectDefinition {
  id: string;
  namespaces: string[];
  clusters: string[];
}

interface ApplicationListQuery {
  0?: ArgoApplication[] | null;
  1?: unknown;
  items?: ArgoApplication[] | null;
  errors?: unknown[] | null;
  isLoading?: boolean;
  clusterResults?: Record<
    string,
    { items?: ArgoApplication[] | null; errors?: unknown[] | null; isLoading?: boolean }
  >;
}

function isExplicitlyLocal(application: ArgoApplication): boolean {
  return (
    application.spec.destination?.server === 'https://kubernetes.default.svc' ||
    application.spec.destination?.name === 'in-cluster'
  );
}

/** Strictly matches Applications to a Headlamp Project's cluster and destination namespace. */
export function getProjectApplications(
  applications: ArgoApplication[],
  project: HeadlampProjectDefinition
): ArgoApplication[] {
  const projectClusters = new Set(project.clusters);
  const projectNamespaces = new Set(project.namespaces);
  const matches = new Map<string, ArgoApplication>();

  applications.forEach(application => {
    const destinationNamespace = application.spec.destination?.namespace;
    if (
      !projectClusters.has(application.cluster) ||
      !isExplicitlyLocal(application) ||
      !destinationNamespace ||
      !projectNamespaces.has(destinationNamespace)
    ) {
      return;
    }

    matches.set(
      `${application.cluster}/${application.metadata.namespace}/${application.metadata.name}`,
      application
    );
  });

  return [...matches.values()].sort((left, right) => {
    const clusterOrder = left.cluster.localeCompare(right.cluster);
    return clusterOrder || left.metadata.name.localeCompare(right.metadata.name);
  });
}

export function getProjectApplicationCounts(applications: ArgoApplication[]) {
  return {
    total: applications.length,
    synced: applications.filter(application => application.syncStatus === 'Synced').length,
    healthy: applications.filter(application => application.healthStatus === 'Healthy').length,
    needsAttention: applications.filter(
      application => application.syncStatus !== 'Synced' || application.healthStatus !== 'Healthy'
    ).length,
  };
}

function normalizeQuery(result: unknown): ApplicationListQuery {
  return result as ApplicationListQuery;
}

/** Identifies Project clusters whose Application list did not return usable results. */
export function getFailedProjectClusters(
  projectClusters: string[],
  clusterResults: ApplicationListQuery['clusterResults'],
  errors: unknown[] | null
): string[] {
  if (clusterResults) {
    return projectClusters.filter(
      cluster => !clusterResults[cluster] || Boolean(clusterResults[cluster].errors?.length)
    );
  }
  return errors?.length ? projectClusters : [];
}

function useProjectApplicationData(project: HeadlampProjectDefinition) {
  const query = normalizeQuery(ArgoApplication.useList({ clusters: project.clusters }));
  const applications = query.items ?? query[0] ?? null;
  const errors = query.errors ?? (query[1] ? [query[1]] : null);
  const clusterResults = query.clusterResults;
  const failedClusters = getFailedProjectClusters(project.clusters, clusterResults, errors);
  const loading = query.isLoading ?? applications === null;

  return {
    applications: getProjectApplications(applications ?? [], project),
    failedClusters,
    loading,
    allFailed: failedClusters.length === project.clusters.length && project.clusters.length > 0,
  };
}

function EmptyState(props: { children: string }) {
  return <Box sx={{ color: 'text.secondary', p: 2, textAlign: 'center' }}>{props.children}</Box>;
}

function SummaryCard(props: { label: string; value: number }) {
  return (
    <Box sx={theme => ({ border: `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 1.5 })}>
      <Typography variant="h5">{props.value}</Typography>
      <Typography color="text.secondary" variant="body2">
        {props.label}
      </Typography>
    </Box>
  );
}

export function ArgoCDProjectOverview(props: { project: HeadlampProjectDefinition }) {
  const state = useProjectApplicationData(props.project);
  const counts = getProjectApplicationCounts(state.applications);

  return (
    <SectionBox title="Argo CD">
      {state.loading ? (
        <EmptyState>Loading Argo CD Applications…</EmptyState>
      ) : state.allFailed ? (
        <EmptyState>Argo CD Application data is unavailable for this Project.</EmptyState>
      ) : (
        <>
          {state.failedClusters.length > 0 && (
            <Typography color="warning.main" sx={{ mb: 1 }}>
              Showing partial results. Some Project clusters could not be read.
            </Typography>
          )}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, minmax(0, 1fr))' },
              gap: 1.5,
            }}
          >
            <SummaryCard label="Total Applications" value={counts.total} />
            <SummaryCard label="Synced" value={counts.synced} />
            <SummaryCard label="Healthy" value={counts.healthy} />
            <SummaryCard label="Needs Attention" value={counts.needsAttention} />
          </Box>
        </>
      )}
    </SectionBox>
  );
}

function sourceSummary(application: ArgoApplication): { concise: string; complete: string } {
  const values = application.sources.map(source => {
    const location = source.path ?? source.chart ?? safeRepositoryIdentifier(source.repoURL);
    return `${location || '-'} @ ${source.targetRevision ?? 'HEAD'}`;
  });
  return {
    concise: values.length > 1 ? `${values.length} sources` : values[0] ?? '-',
    complete: values.join('\n') || '-',
  };
}

export function ArgoCDProjectApplicationsTab(props: { project: HeadlampProjectDefinition }) {
  const state = useProjectApplicationData(props.project);
  const showCluster = props.project.clusters.length > 1;

  if (state.loading) return <EmptyState>Loading Argo CD Applications…</EmptyState>;
  if (state.allFailed)
    return <EmptyState>Argo CD Application data is unavailable for this Project.</EmptyState>;
  if (!state.applications.length)
    return <EmptyState>No Argo CD Applications deploy into this Project’s namespaces.</EmptyState>;

  return (
    <SectionBox title="Argo CD Applications">
      {state.failedClusters.length > 0 && (
        <Typography color="warning.main" sx={{ mb: 1 }}>
          Showing partial results. Some Project clusters could not be read.
        </Typography>
      )}
      <SimpleTable
        data={state.applications}
        columns={[
          {
            label: 'Application',
            getter: application => (
              <Link
                routeName="argocd-application-detail"
                params={{
                  namespace: application.metadata.namespace,
                  name: application.metadata.name,
                }}
                activeCluster={application.cluster}
              >
                {application.metadata.name}
              </Link>
            ),
          },
          { label: 'Argo CD Namespace', getter: application => application.metadata.namespace },
          {
            label: 'Target Namespace',
            getter: application => application.spec.destination.namespace,
          },
          ...(showCluster
            ? [{ label: 'Cluster', getter: (application: ArgoApplication) => application.cluster }]
            : []),
          {
            label: 'Source / Revision',
            getter: application => {
              const summary = sourceSummary(application);
              return (
                <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{summary.complete}</span>}>
                  <span>{summary.concise}</span>
                </Tooltip>
              );
            },
          },
          {
            label: 'Sync',
            getter: application => (
              <StatusLabel status={getSyncStatus(application.syncStatus)}>
                {application.syncStatus}
              </StatusLabel>
            ),
          },
          {
            label: 'Health',
            getter: application => (
              <StatusLabel status={getHealthStatus(application.healthStatus)}>
                {application.healthStatus}
              </StatusLabel>
            ),
          },
        ]}
      />
    </SectionBox>
  );
}
