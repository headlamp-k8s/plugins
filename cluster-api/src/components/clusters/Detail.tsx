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
import { Typography } from '@mui/material';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { Cluster, type ReplicasStatus } from '../../resources/cluster';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { GetKubeconfigAction } from '../actions';
import { OwnedMachinesSection, renderReplicas } from '../common';
import { getPhaseStatus, renderReference } from '../common/util';
import { renderConditionStatus } from '../common/util';

/**
 * Props for the ClusterDetail component.
 * @see https://cluster-api.sigs.k8s.io/concepts/cluster/
 */
interface ClusterNode {
  /** The actual Cluster resource object */
  kubeObject: Cluster;
}

/**
 * Main detail view component for the Cluster resource.
 * Handles API version detection and data fetching wrappers.
 */
export function ClusterDetail({ node }: { node: ClusterNode }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;
  if (!crName) return <EmptyContent color="error">Missing resource name</EmptyContent>;

  return <ClusterDetailContent crName={crName} namespace={namespace} crdName={Cluster.crdName} />;
}

/**
 * Props for the ClusterDetailContent wrapper.
 */
interface ClusterDetailContentProps {
  /** The resource name from the URL params */
  crName: string;
  /** The namespace from the URL params */
  namespace?: string;
  /** The fully qualified CRD name */
  crdName: string;
}

/**
 * Props for the versioned Cluster detail view.
 */
interface ClusterDetailWithVersionProps extends ClusterDetailContentProps {
  /** The resource class bound to the detected API version */
  VersionedCluster: typeof Cluster;
  /** The detected CAPI API version (e.g., v1beta1, v1beta2) */
  apiVersion: string;
}

/**
 * Wrapper component to detect CAPI API version for a Cluster.
 *
 * @param props - Component properties.
 */
function ClusterDetailContent(props: ClusterDetailContentProps) {
  const { crName, namespace, crdName } = props;
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

/**
 * Renders the final Cluster detail view with all fetched data.
 *
 * @param props - Component properties including the versioned class and version.
 */
function ClusterDetailWithData(props: ClusterDetailWithVersionProps) {
  const { crName, namespace, VersionedCluster, crdName } = props;
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

  /**
   * Helper to render replica status for control plane or worker nodes.
   *
   * @param status - The replica status from the Cluster status.
   * @returns A rendered replica status or dash.
   */
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
      actions={(resource: Cluster) =>
        resource ? [<GetKubeconfigAction resource={resource} />] : []
      }
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
              item.status?.controlPlaneReady === undefined ? (
                '-'
              ) : (
                <StatusLabel status={item.status.controlPlaneReady ? 'success' : 'error'}>
                  {item.status.controlPlaneReady ? 'true' : 'false'}
                </StatusLabel>
              ),
            hide: item.status?.controlPlaneReady === undefined,
          },
          {
            name: 'Infrastructure Ready',
            value:
              item.status?.infrastructureReady === undefined ? (
                '-'
              ) : (
                <StatusLabel status={item.status.infrastructureReady ? 'success' : 'error'}>
                  {item.status.infrastructureReady ? 'true' : 'false'}
                </StatusLabel>
              ),
            hide: item.status?.infrastructureReady === undefined,
          },
          {
            name: 'Control Plane Initialized',
            value:
              initialization?.controlPlaneInitialized === undefined ? (
                '-'
              ) : (
                <StatusLabel
                  status={initialization.controlPlaneInitialized ? 'success' : 'warning'}
                >
                  {initialization.controlPlaneInitialized ? 'true' : 'false'}
                </StatusLabel>
              ),
            hide: initialization?.controlPlaneInitialized === undefined,
          },
          {
            name: 'Infrastructure Provisioned',
            value:
              initialization?.infrastructureProvisioned === undefined ? (
                '-'
              ) : (
                <StatusLabel
                  status={initialization.infrastructureProvisioned ? 'success' : 'warning'}
                >
                  {initialization.infrastructureProvisioned ? 'true' : 'false'}
                </StatusLabel>
              ),
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
          const machinePools = spec.topology?.workers?.machinePools ?? [];
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
              name: 'Topology Machine Pools',
              value:
                machinePools.length > 0 ? (
                  <SimpleTable
                    columns={[
                      { label: 'Name', getter: (row: { name: string }) => row.name },
                      { label: 'Class', getter: (row: { class: string }) => row.class },
                      {
                        label: 'Replicas',
                        getter: (row: { replicas?: number }) => row.replicas ?? '-',
                      },
                    ]}
                    data={machinePools}
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
                            <Typography
                              component="pre"
                              sx={{
                                margin: 0,
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {JSON.stringify(row.value, null, 2)}
                            </Typography>
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
