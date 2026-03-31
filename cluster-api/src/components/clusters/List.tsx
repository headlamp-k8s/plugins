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

function ClustersListWithData({ ClusterClass }: ClustersListWithDataProps) {
  return (
    <ResourceListView
      title="Clusters"
      resourceClass={ClusterClass}
      columns={[
        'name',
        'namespace',
        {
          id: 'clusterclass',
          label: 'Cluster Class',
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
          id: 'phase',
          label: 'Phase',
          getValue: cluster => cluster.status?.phase ?? '-',
          render: cluster => {
            const phase = cluster.status?.phase;
            if (!phase) return '-';
            return <StatusLabel status={getPhaseStatus(phase)}>{phase}</StatusLabel>;
          },
        },
        {
          id: 'Available',
          label: 'Available',
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
          label: 'Version',
          getValue: cluster => cluster.spec?.topology?.version ?? '-',
        },
        'age',
      ]}
    />
  );
}

export function ClustersList() {
  const version = useCapiApiVersion(Cluster.crdName, 'v1beta1');
  const VersionedCluster = useMemo(
    () => (version ? Cluster.withApiVersion(version) : Cluster),
    [version]
  );
  if (!version) return <Loader title="Detecting Cluster API version" />;
  return <ClustersListWithData ClusterClass={VersionedCluster} />;
}
