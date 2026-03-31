import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { Cluster, type ReplicasStatus } from '../../resources/cluster';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { GetKubeconfigAction } from '../actions';
import { OwnedMachinesSection, renderReplicas } from '../common';
import { getPhaseStatus, renderReference } from '../common/util';
import { renderConditionStatus } from '../common/util';

type ClusterNode = { kubeObject: Cluster };

export function ClusterDetail({ node }: { node?: ClusterNode }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;
  if (!crName) return <EmptyContent color="error">Missing resource name</EmptyContent>;

  return <ClusterDetailContent crName={crName} namespace={namespace} crdName={Cluster.crdName} />;
}

interface ClusterDetailContentProps {
  crName: string;
  namespace?: string;
  crdName: string;
}

interface ClusterDetailWithVersionProps extends ClusterDetailContentProps {
  VersionedCluster: typeof Cluster;
  apiVersion: string;
}

function ClusterDetailContent({ crName, namespace, crdName }: ClusterDetailContentProps) {
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedCluster = useMemo(
    () => (apiVersion ? Cluster.withApiVersion(apiVersion) : Cluster),
    [apiVersion]
  );
  if (!apiVersion) return <Loader title="Detecting Cluster API version" />;
  return (
    <ClusterDetailWithData
      crName={crName}
      namespace={namespace}
      crdName={crdName}
      VersionedCluster={VersionedCluster}
      apiVersion={apiVersion}
    />
  );
}

function ClusterDetailWithData({
  crName,
  namespace,
  VersionedCluster,
  crdName,
}: ClusterDetailWithVersionProps) {
  const [crd] = CustomResourceDefinition.useGet(crdName, undefined);
  const [item, itemError] = VersionedCluster.useGet(crName, namespace ?? undefined);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        Error loading Cluster {crName}: {itemError?.message}
      </EmptyContent>
    );
  }
  if (!item) return <Loader title="Loading Cluster details" />;

  const spec = item.spec;

  const podsCidr = spec?.clusterNetwork?.pods?.cidrBlocks?.join(', ');
  const servicesCidr = spec?.clusterNetwork?.services?.cidrBlocks?.join(', ');
  const controlPlaneEndpoint = spec?.controlPlaneEndpoint
    ? `${spec.controlPlaneEndpoint.host}:${spec.controlPlaneEndpoint.port}`
    : '-';
  const controlPlaneStatus = item.controlPlaneStatus;
  const workerStatus = item.workerStatus;
  const initialization = item.initialization;
  const observedGeneration = item.status?.observedGeneration;

  const renderReplicaValue = (status?: ReplicasStatus) => {
    if (!status) return '-';
    const replicaLike = {
      spec: { replicas: status.desiredReplicas },
      status: {
        replicas: status.replicas,
        readyReplicas: status.readyReplicas,
        availableReplicas: status.availableReplicas,
        updatedReplicas: status.upToDateReplicas,
      },
      upToDateReplicas: status.upToDateReplicas,
    };
    return renderReplicas(replicaLike) ?? '-';
  };

  return (
    <DetailsGrid
      resourceType={VersionedCluster}
      withEvents
      name={crName}
      namespace={namespace ?? undefined}
      actions={resource => [
        resource && {
          id: 'cluster-api.get-kubeconfig',
          action: GetKubeconfigAction({ resource }),
          label: 'Download Kubeconfig',
          description: 'Download Kubeconfig',
          longDescription: 'Download the Kubeconfig file for this cluster',
          icon: 'mdi:cloud-download',
        },
      ]}
      extraInfo={() => {
        const clusterClassName = spec?.topology?.class ?? spec?.topology?.classRef?.name;

        return [
          {
            name: 'Definition',
            value: (
              <Link routeName="crd" params={{ name: crdName }}>
                {crdName}
              </Link>
            ),
            hide: !crd,
          },
          {
            name: 'Cluster Class',
            value: clusterClassName ? (
              <Link
                routeName="clusterclass"
                params={{
                  name: clusterClassName,
                  namespace,
                }}
              >
                {clusterClassName}
              </Link>
            ) : (
              '-'
            ),
          },

          {
            name: 'Phase',
            value: (
              <StatusLabel status={getPhaseStatus(item.status?.phase)}>
                {item.status?.phase}
              </StatusLabel>
            ),
            hide: !item.status?.phase,
            priority: 1,
          },
          {
            name: 'Control Plane Ready',
            value:
              item.status?.controlPlaneReady === undefined
                ? '-'
                : item.status.controlPlaneReady
                ? 'true'
                : 'false',
            hide: item.status?.controlPlaneReady === undefined,
          },
          {
            name: 'Infrastructure Ready',
            value:
              item.status?.infrastructureReady === undefined
                ? '-'
                : item.status.infrastructureReady
                ? 'true'
                : 'false',
            hide: item.status?.infrastructureReady === undefined,
          },
          {
            name: 'Control Plane Initialized',
            value:
              initialization?.controlPlaneInitialized === undefined
                ? '-'
                : initialization.controlPlaneInitialized
                ? 'true'
                : 'false',
            hide: initialization?.controlPlaneInitialized === undefined,
          },
          {
            name: 'Infrastructure Provisioned',
            value:
              initialization?.infrastructureProvisioned === undefined
                ? '-'
                : initialization.infrastructureProvisioned
                ? 'true'
                : 'false',
            hide: initialization?.infrastructureProvisioned === undefined,
          },
          {
            name: 'Paused',
            value: renderConditionStatus(spec?.paused ? 'true' : 'false', undefined, {
              trueLabel: 'true',
              falseLabel: 'false',
              trueStatus: 'warning',
              falseStatus: 'success',
            }),
          },
          {
            name: 'API Server Port',
            value: spec?.clusterNetwork?.apiServerPort ?? 'default (6443)',
          },
          {
            name: 'Pod CIDR Blocks',
            value: podsCidr ?? '-',
          },
          {
            name: 'Service CIDR Blocks',
            value: servicesCidr ?? '-',
          },
          {
            name: 'Service Domain',
            value: spec?.clusterNetwork?.serviceDomain ?? 'default (cluster.local)',
          },
          {
            name: 'Control Plane Endpoint',
            value: controlPlaneEndpoint,
          },
          {
            name: 'Version',
            value: spec?.topology?.version ?? '-',
          },
          {
            name: 'Control Plane Replicas',
            value: renderReplicaValue(controlPlaneStatus),
            hide: !controlPlaneStatus,
          },
          {
            name: 'Worker Replicas',
            value: renderReplicaValue(workerStatus),
            hide: !workerStatus,
          },
          {
            name: 'Observed Generation',
            value:
              observedGeneration !== undefined
                ? `${observedGeneration} / ${item.metadata?.generation ?? '-'}`
                : '-',
            hide: observedGeneration === undefined,
          },
        ];
      }}
      extraSections={cluster => {
        const spec = cluster.spec;
        const sections = [
          {
            id: 'cluster-api.cluster-conditions',
            section: (
              <ConditionsSection
                resource={{
                  ...cluster.jsonData,
                  status: {
                    ...cluster.jsonData.status,
                    conditions: cluster.conditions,
                  },
                }}
              />
            ),
          },
          {
            id: 'cluster-api.cluster-owned-machines',
            section: (
              <OwnedMachinesSection resource={cluster} hideColumns={['owner']} showCreateButton />
            ),
          },
        ];

        if (spec && cluster) {
          const topologyClass = spec.topology?.class ?? spec.topology?.classRef?.name;
          const machineDeployments = spec.topology?.workers?.machineDeployments ?? [];
          const topologyVariables = spec.topology?.variables ?? [];

          const clusterSpecRows = [
            { name: 'Pods CIDRs', value: podsCidr ?? '-' },
            { name: 'Services CIDRs', value: servicesCidr ?? '-' },
            {
              name: 'Service Domain',
              value: spec.clusterNetwork?.serviceDomain ?? 'default (cluster.local)',
            },
            {
              name: 'API Server Port',
              value: spec.clusterNetwork?.apiServerPort ?? 'default (6443)',
            },
            { name: 'Control Plane Endpoint', value: controlPlaneEndpoint },
            { name: 'Control Plane Ref', value: renderReference(spec.controlPlaneRef) },
            { name: 'Infrastructure Ref', value: renderReference(spec.infrastructureRef) },
            { name: 'Topology Class', value: topologyClass ?? '-' },
            { name: 'Topology Version', value: spec.topology?.version ?? '-' },
            {
              name: 'Topology Control Plane Replicas',
              value: spec.topology?.controlPlane?.replicas ?? '-',
            },
            {
              name: 'Topology Machine Deployments',
              value:
                machineDeployments.length > 0 ? (
                  <SimpleTable
                    columns={[
                      { label: 'Name', getter: (row: { name: string }) => row.name },
                      { label: 'Class', getter: (row: { class: string }) => row.class },
                      {
                        label: 'Replicas',
                        getter: (row: { replicas?: number }) => row.replicas ?? '-',
                      },
                    ]}
                    data={machineDeployments}
                  />
                ) : (
                  '-'
                ),
            },
            {
              name: 'Topology Variables',
              value:
                topologyVariables.length > 0 ? (
                  <SimpleTable
                    columns={[
                      { label: 'Name', getter: (row: { name: string }) => row.name },
                      {
                        label: 'Value',
                        getter: (row: { value: unknown }) =>
                          typeof row.value === 'object' ? (
                            <pre style={{ margin: 0 }}>{JSON.stringify(row.value, null, 2)}</pre>
                          ) : (
                            String(row.value ?? '')
                          ),
                      },
                    ]}
                    data={topologyVariables}
                  />
                ) : (
                  '-'
                ),
            },
          ];

          sections.push({
            id: 'cluster-api.cluster-spec',
            section: (
              <SectionBox title="Cluster Spec">
                <NameValueTable rows={clusterSpecRows} />
              </SectionBox>
            ),
          });
        }

        return sections;
      }}
    />
  );
}
