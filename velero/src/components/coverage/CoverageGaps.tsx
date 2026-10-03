import {
  EmptyContent,
  Link,
  Loader,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import Deployment from '@kinvolk/headlamp-plugin/lib/K8s/deployment';
import Namespace from '@kinvolk/headlamp-plugin/lib/K8s/namespace';
import StatefulSet from '@kinvolk/headlamp-plugin/lib/K8s/statefulSet';
import { Paper, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useVeleroData } from '../../hooks/useVeleroData';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

type WorkloadRow = {
  kind: 'Deployment' | 'StatefulSet';
  resource: KubeObject;
};

function CoverageGapsContent() {
  const { loading, error, getCoverageForWorkload, getSchedulesForNamespace } = useVeleroData();
  const [namespaces, namespacesError] = Namespace.useList();
  const [deployments, deploymentsError] = Deployment.useList();
  const [statefulSets, statefulSetsError] = StatefulSet.useList();

  const uncoveredNamespaces = useMemo(() => {
    if (!namespaces) {
      return [];
    }
    return namespaces
      .filter(ns => {
        const name = ns.metadata.name;
        // Skip system namespaces that operators usually leave out of app backups.
        if (name === 'kube-system' || name === 'kube-public' || name === 'kube-node-lease') {
          return false;
        }
        return getSchedulesForNamespace(name).length === 0;
      })
      .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
  }, [namespaces, getSchedulesForNamespace]);

  const uncoveredWorkloads = useMemo(() => {
    const rows: WorkloadRow[] = [];

    for (const deployment of deployments ?? []) {
      const coverage = getCoverageForWorkload({
        namespace: deployment.metadata.namespace,
        labels: deployment.metadata.labels ?? {},
        resourceKind: 'deployments',
      });
      if (coverage.length === 0) {
        rows.push({
          kind: 'Deployment',
          resource: deployment,
        });
      }
    }

    for (const statefulSet of statefulSets ?? []) {
      const coverage = getCoverageForWorkload({
        namespace: statefulSet.metadata.namespace,
        labels: statefulSet.metadata.labels ?? {},
        resourceKind: 'statefulsets',
      });
      if (coverage.length === 0) {
        rows.push({
          kind: 'StatefulSet',
          resource: statefulSet,
        });
      }
    }

    return rows.sort((a, b) => {
      const aKey = `${a.resource.getNamespace()}/${a.resource.getName()}`;
      const bKey = `${b.resource.getNamespace()}/${b.resource.getName()}`;
      return aKey.localeCompare(bKey);
    });
  }, [deployments, statefulSets, getCoverageForWorkload]);

  const listError = error ?? namespacesError ?? deploymentsError ?? statefulSetsError;
  const listsLoading =
    loading || namespaces === null || deployments === null || statefulSets === null;

  if (listsLoading) {
    return <Loader title="" />;
  }

  if (listError) {
    return (
      <SectionBox title="Coverage gaps">
        <Paper variant="outlined">
          <EmptyContent>
            Failed to load coverage data: {listError.message || String(listError)}
          </EmptyContent>
        </Paper>
      </SectionBox>
    );
  }

  return (
    <>
      <SectionBox title="Coverage gaps">
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Namespaces and workloads that are not matched by any Velero Schedule template (read-only).
          System namespaces are omitted from the namespace list.
        </Typography>
      </SectionBox>

      <SectionBox title="Namespaces without a matching schedule">
        {uncoveredNamespaces.length === 0 ? (
          <Paper variant="outlined">
            <EmptyContent>Every listed namespace is covered by at least one schedule.</EmptyContent>
          </Paper>
        ) : (
          <SimpleTable
            columns={[
              {
                label: 'Namespace',
                getter: (ns: Namespace) => <Link kubeObject={ns}>{ns.metadata.name}</Link>,
              },
            ]}
            data={uncoveredNamespaces}
          />
        )}
      </SectionBox>

      <SectionBox title="Workloads without a matching schedule">
        {uncoveredWorkloads.length === 0 ? (
          <Paper variant="outlined">
            <EmptyContent>
              Every Deployment and StatefulSet is covered by at least one schedule.
            </EmptyContent>
          </Paper>
        ) : (
          <SimpleTable
            columns={[
              {
                label: 'Kind',
                getter: (row: WorkloadRow) => row.kind,
              },
              {
                label: 'Name',
                getter: (row: WorkloadRow) => (
                  <Link kubeObject={row.resource}>{row.resource.getName()}</Link>
                ),
              },
              {
                label: 'Namespace',
                getter: (row: WorkloadRow) => row.resource.getNamespace(),
              },
            ]}
            data={uncoveredWorkloads}
          />
        )}
      </SectionBox>
    </>
  );
}

/** Cluster-wide coverage gap view for namespaces and workloads (Phase 2). */
export default function CoverageGaps() {
  return (
    <VeleroInstallCheck>
      <CoverageGapsContent />
    </VeleroInstallCheck>
  );
}
