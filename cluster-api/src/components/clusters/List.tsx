import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Link,
  Loader,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { Cluster } from '../../resources/cluster';
import { getCondition } from '../../resources/common';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { getPhaseStatus } from '../common/util';
import { renderConditionStatus } from '../common/util';

interface ClustersListWithDataProps {
  ClusterClass: typeof Cluster;
}

/**
 * Renders the cluster list view using the provided Cluster class (versioned).
 *
 * @param props - Component properties.
 * @param props.ClusterClass - The Cluster resource class to use for fetching.
 */
function ClustersListWithData({ ClusterClass }: ClustersListWithDataProps) {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Clusters')}
      resourceClass={ClusterClass}
      columns={[
        'name',
        'namespace',
        {
          id: 'clusterclass',
          label: t('Cluster Class'),
          getValue: cluster =>
            cluster.spec?.topology?.class ?? cluster.spec?.topology?.classRef?.name ?? '-',
          render: cluster => {
            const className =
              cluster.spec?.topology?.class ?? cluster.spec?.topology?.classRef?.name;
            if (!className) return '-';
            return (
              <Link
                routeName="clusterclass"
                params={{
                  name: className,
                  namespace: cluster.metadata?.namespace,
                }}
              >
                {className}
              </Link>
            );
          },
        },

        {
          id: 'cpreplicas',
          label: t('CP Replicas'),
          getValue: cluster =>
            `${cluster.controlPlaneStatus?.readyReplicas ?? 0}/${
              cluster.controlPlaneStatus?.desiredReplicas ?? 0
            }`,
          render: cluster => {
            const ready = cluster.controlPlaneStatus?.readyReplicas ?? 0;
            const desired = cluster.controlPlaneStatus?.desiredReplicas ?? 0;
            const isReady = ready === desired && desired > 0;
            return (
              <StatusLabel status={isReady ? 'success' : 'warning'}>
                {ready}/{desired}
              </StatusLabel>
            );
          },
        },
        {
          id: 'wreplicas',
          label: t('Workers Replicas'),
          getValue: cluster =>
            `${cluster.workerStatus?.readyReplicas ?? 0}/${
              cluster.workerStatus?.desiredReplicas ?? 0
            }`,
          render: cluster => {
            const ready = cluster.workerStatus?.readyReplicas ?? 0;
            const desired = cluster.workerStatus?.desiredReplicas ?? 0;
            const isReady = ready === desired && desired > 0;
            return (
              <StatusLabel status={isReady ? 'success' : 'warning'}>
                {ready}/{desired}
              </StatusLabel>
            );
          },
        },
        {
          id: 'phase',
          label: t('Phase'),
          getValue: cluster => cluster.status?.phase ?? '-',
          render: cluster => {
            const phase = cluster.status?.phase;
            if (!phase) return '-';
            return <StatusLabel status={getPhaseStatus(phase)}>{phase}</StatusLabel>;
          },
        },
        {
          id: 'Available',
          label: t('Available'),
          getValue: (c: Cluster) => {
            const cond =
              getCondition(c.conditions, 'Available') || getCondition(c.conditions, 'Ready'); // ready only in v1beta1
            if (!cond) return 'Unknown';
            return cond?.status;
          },
          render: (c: Cluster) => {
            const cond =
              getCondition(c.conditions, 'Available') || getCondition(c.conditions, 'Ready');
            return renderConditionStatus(undefined, cond, {
              trueLabel: 'true',
              falseLabel: 'false',
              trueStatus: 'success',
              falseStatus: 'error',
            });
          },
        },
        {
          id: 'version',
          label: t('Version'),
          getValue: cluster => cluster.spec?.topology?.version ?? '-',
        },
        'age',
      ]}
    />
  );
}

/**
 * Main entry point for the Cluster list view.
 * Handles API version detection and passes the versioned class to the renderer.
 */
export function ClustersList() {
  const { t } = useTranslation();
  const version = useCapiApiVersion(Cluster.crdName, 'v1beta1');
  const VersionedCluster = useMemo(
    () => (version ? Cluster.withApiVersion(version) : Cluster),
    [version]
  );
  if (!version) return <Loader title={t('Detecting Cluster API version')} />;
  return <ClustersListWithData ClusterClass={VersionedCluster} />;
}
